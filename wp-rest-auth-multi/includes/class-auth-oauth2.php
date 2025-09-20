<?php
/**
 * OAuth2 Authentication class (Authorization Code flow simplified)
 */

if (!defined('ABSPATH')) {
    exit;
}

class Auth_OAuth2 {

    const CODE_TTL = 300;     // 5 minutes
    const TOKEN_TTL = 3600;   // 1 hour
    const OPTION_CLIENTS = 'oauth2_clients';

    public function register_routes(): void {
        register_rest_route('oauth2/v1', '/authorize', [
            'methods' => 'GET',
            'callback' => [$this, 'authorize_endpoint'],
            'permission_callback' => '__return_true',
            'args' => [
                'response_type' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['code']
                ],
                'client_id' => [
                    'required' => true,
                    'type' => 'string'
                ],
                'redirect_uri' => [
                    'required' => true,
                    'type' => 'string',
                    'format' => 'uri'
                ],
                'state' => [
                    'required' => false,
                    'type' => 'string'
                ]
            ]
        ]);

        register_rest_route('oauth2/v1', '/token', [
            'methods' => 'POST',
            'callback' => [$this, 'token_endpoint'],
            'permission_callback' => '__return_true',
            'args' => [
                'grant_type' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['authorization_code']
                ],
                'code' => [
                    'required' => true,
                    'type' => 'string'
                ],
                'redirect_uri' => [
                    'required' => true,
                    'type' => 'string'
                ],
                'client_id' => [
                    'required' => true,
                    'type' => 'string'
                ],
                'client_secret' => [
                    'required' => true,
                    'type' => 'string'
                ]
            ]
        ]);

        register_rest_route('oauth2/v1', '/userinfo', [
            'methods' => 'GET',
            'callback' => [$this, 'userinfo_endpoint'],
            'permission_callback' => '__return_true'
        ]);

        // Add CORS support
        add_action('rest_api_init', [$this, 'add_cors_support']);
    }

    public function add_cors_support(): void {
        add_filter('rest_pre_serve_request', function($served, $result, $request, $server) {
            wp_auth_multi_maybe_add_cors_headers();
            return $served;
        }, 15, 4);
    }

    public function authorize_endpoint(WP_REST_Request $request) {
        wp_auth_multi_maybe_add_cors_headers();

        $response_type = $request->get_param('response_type');
        $client_id = $request->get_param('client_id');
        $redirect_uri = $request->get_param('redirect_uri');
        $state = $request->get_param('state');

        if ($response_type !== 'code') {
            return $this->oauth_error_redirect($redirect_uri, 'unsupported_response_type', $state);
        }

        $client = $this->get_client($client_id);
        if (!$client) {
            return $this->oauth_error_redirect($redirect_uri, 'unauthorized_client', $state);
        }

        if (!in_array($redirect_uri, $client['redirect_uris'], true)) {
            return $this->oauth_error_redirect(
                $client['redirect_uris'][0] ?? null,
                'invalid_redirect_uri',
                $state
            );
        }

        if (!is_user_logged_in()) {
            $login_url = wp_login_url(add_query_arg($request->get_query_params(), rest_url('oauth2/v1/authorize')));
            return new WP_REST_Response([
                'error' => 'login_required',
                'login_url' => $login_url
            ], 401);
        }

        $user = wp_get_current_user();
        $code = wp_auth_multi_generate_token(32);

        // Store authorization code
        set_transient($this->code_key($code), [
            'client_id' => $client_id,
            'user_id' => $user->ID,
            'redirect_uri' => $redirect_uri,
            'created' => time()
        ], self::CODE_TTL);

        // Auto-approve for demo (in production, show consent screen)
        $location = add_query_arg(array_filter([
            'code' => $code,
            'state' => $state
        ]), $redirect_uri);

        return new WP_REST_Response([
            'redirect_to' => $location
        ], 302);
    }

    public function token_endpoint(WP_REST_Request $request) {
        wp_auth_multi_maybe_add_cors_headers();

        $grant_type = $request->get_param('grant_type');
        $code = $request->get_param('code');
        $redirect_uri = $request->get_param('redirect_uri');
        $client_id = $request->get_param('client_id');
        $client_secret = $request->get_param('client_secret');

        if ($grant_type !== 'authorization_code') {
            return new WP_Error(
                'unsupported_grant_type',
                'Only authorization_code grant type is supported',
                ['status' => 400]
            );
        }

        $client = $this->get_client($client_id);
        if (!$client) {
            return new WP_Error(
                'invalid_client',
                'Invalid client',
                ['status' => 401]
            );
        }

        if (!wp_check_password($client_secret, $client['client_secret'])) {
            return new WP_Error(
                'invalid_client',
                'Invalid client credentials',
                ['status' => 401]
            );
        }

        $code_data = get_transient($this->code_key($code));
        if (!$code_data) {
            return new WP_Error(
                'invalid_grant',
                'Invalid or expired authorization code',
                ['status' => 400]
            );
        }

        if ($code_data['client_id'] !== $client_id) {
            return new WP_Error(
                'invalid_grant',
                'Authorization code was issued to another client',
                ['status' => 400]
            );
        }

        if ($code_data['redirect_uri'] !== $redirect_uri) {
            return new WP_Error(
                'invalid_grant',
                'Redirect URI does not match',
                ['status' => 400]
            );
        }

        // Consume the authorization code
        delete_transient($this->code_key($code));

        // Generate access token
        $access_token = wp_auth_multi_generate_token(48);

        // Store access token
        set_transient($this->token_key($access_token), [
            'user_id' => $code_data['user_id'],
            'client_id' => $client_id,
            'created' => time()
        ], self::TOKEN_TTL);

        return [
            'access_token' => $access_token,
            'token_type' => 'Bearer',
            'expires_in' => self::TOKEN_TTL,
            'scope' => 'read'
        ];
    }

    public function userinfo_endpoint(WP_REST_Request $request) {
        wp_auth_multi_maybe_add_cors_headers();

        $user = wp_get_current_user();

        if (!$user || !$user->ID) {
            return new WP_Error(
                'unauthorized',
                'Not authenticated',
                ['status' => 401]
            );
        }

        return [
            'sub' => (string)$user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'roles' => array_values($user->roles),
            'name' => $user->display_name
        ];
    }

    public function authenticate_bearer(string $token) {
        $token_data = get_transient($this->token_key($token));

        if (!$token_data) {
            return new WP_Error(
                'invalid_token',
                'Invalid or expired access token',
                ['status' => 401]
            );
        }

        $user = get_user_by('id', (int)$token_data['user_id']);
        if (!$user) {
            return new WP_Error(
                'invalid_token_user',
                'User not found',
                ['status' => 401]
            );
        }

        wp_set_current_user($user->ID);
        return true;
    }

    private function get_client(string $client_id): ?array {
        if (empty($client_id)) {
            return null;
        }

        $clients = get_option(self::OPTION_CLIENTS, []);
        return $clients[$client_id] ?? null;
    }

    private function code_key(string $code): string {
        return 'oauth2_code_' . md5($code);
    }

    private function token_key(string $token): string {
        return 'oauth2_token_' . md5($token);
    }

    private function oauth_error_redirect(string $redirect_uri = null, string $error = 'invalid_request', string $state = null) {
        if (!$redirect_uri) {
            return new WP_Error($error, 'OAuth2 error: ' . $error, ['status' => 400]);
        }

        $params = array_filter([
            'error' => $error,
            'state' => $state
        ]);

        $location = add_query_arg($params, $redirect_uri);

        return new WP_REST_Response([
            'error' => $error,
            'redirect_to' => $location
        ], 302);
    }

    public static function upsert_client(string $client_id, string $client_secret, array $redirect_uris): void {
        $clients = get_option(self::OPTION_CLIENTS, []);

        $clients[$client_id] = [
            'client_secret' => wp_hash_password($client_secret),
            'redirect_uris' => array_values($redirect_uris)
        ];

        update_option(self::OPTION_CLIENTS, $clients);
    }

    public function get_clients(): array {
        return get_option(self::OPTION_CLIENTS, []);
    }

    public function revoke_token(string $access_token): bool {
        return delete_transient($this->token_key($access_token));
    }

    public function clean_expired_codes(): void {
        // Transients are automatically cleaned by WordPress
        // This is a placeholder for custom cleanup if needed
    }

    public function validate_redirect_uri(string $client_id, string $redirect_uri): bool {
        $client = $this->get_client($client_id);

        if (!$client) {
            return false;
        }

        return in_array($redirect_uri, $client['redirect_uris'], true);
    }
}