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

    // Available OAuth2 scopes and their descriptions
    const AVAILABLE_SCOPES = [
        'read' => 'View your posts, pages, and profile information',
        'write' => 'Create and edit posts and pages',
        'delete' => 'Delete posts and pages',
        'manage_users' => 'View and manage user accounts (admin only)',
        'upload_files' => 'Upload and manage media files',
        'edit_theme' => 'Modify theme and appearance settings (admin only)',
        'moderate_comments' => 'Moderate and manage comments',
        'view_stats' => 'Access website statistics and analytics'
    ];

    public function __construct() {
        add_action('init', [$this, 'handle_authorize_page']);
    }

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

    public function handle_authorize_page(): void {
        // Check if this is an OAuth authorize request
        if (isset($_GET['oauth2_authorize'])) {
            $this->process_authorize_request();
        }
    }

    private function process_authorize_request(): void {
        $response_type = $_GET['response_type'] ?? '';
        $client_id = $_GET['client_id'] ?? '';
        $redirect_uri = $_GET['redirect_uri'] ?? '';
        $state = $_GET['state'] ?? '';
        $requested_scope = $_GET['scope'] ?? 'read';

        // Validate parameters
        if ($response_type !== 'code') {
            $this->redirect_with_error($redirect_uri, 'unsupported_response_type', $state);
            return;
        }

        if (empty($client_id) || empty($redirect_uri)) {
            $this->redirect_with_error($redirect_uri, 'invalid_request', $state);
            return;
        }

        $client = $this->get_client($client_id);
        if (!$client) {
            $this->redirect_with_error($redirect_uri, 'unauthorized_client', $state);
            return;
        }

        if (!in_array($redirect_uri, $client['redirect_uris'], true)) {
            $this->redirect_with_error(
                $client['redirect_uris'][0] ?? null,
                'invalid_redirect_uri',
                $state
            );
            return;
        }

        // Validate requested scopes
        $scopes = $this->parse_scopes($requested_scope);
        $valid_scopes = $this->validate_scopes($scopes);

        if (empty($valid_scopes)) {
            $this->redirect_with_error($redirect_uri, 'invalid_scope', $state);
            return;
        }

        if (!is_user_logged_in()) {
            $login_url = wp_login_url(add_query_arg([
                'oauth2_authorize' => '1',
                'response_type' => $response_type,
                'client_id' => $client_id,
                'redirect_uri' => $redirect_uri,
                'state' => $state,
                'scope' => $requested_scope
            ], home_url()));

            wp_redirect($login_url);
            exit;
        }

        $user = wp_get_current_user();

        // Check if user has already consented or if consent is being processed
        if (isset($_POST['oauth2_consent'])) {
            $this->handle_consent_response($client_id, $redirect_uri, $state, $valid_scopes, $user->ID);
            return;
        }

        // Show consent screen
        $this->show_consent_screen($client_id, $redirect_uri, $state, $valid_scopes);
    }

    private function parse_scopes(string $scope_string): array {
        return array_filter(array_map('trim', explode(' ', $scope_string)));
    }

    private function validate_scopes(array $requested_scopes): array {
        $valid_scopes = [];
        $user = wp_get_current_user();

        foreach ($requested_scopes as $scope) {
            if (!array_key_exists($scope, self::AVAILABLE_SCOPES)) {
                continue;
            }

            // Check if user has capability for this scope
            if ($this->user_can_access_scope($user, $scope)) {
                $valid_scopes[] = $scope;
            }
        }

        return $valid_scopes;
    }

    private function user_can_access_scope(WP_User $user, string $scope): bool {
        switch ($scope) {
            case 'read':
                return true; // Everyone can read
            case 'write':
                return user_can($user, 'edit_posts');
            case 'delete':
                return user_can($user, 'delete_posts');
            case 'manage_users':
                return user_can($user, 'list_users');
            case 'upload_files':
                return user_can($user, 'upload_files');
            case 'edit_theme':
                return user_can($user, 'edit_theme_options');
            case 'moderate_comments':
                return user_can($user, 'moderate_comments');
            case 'view_stats':
                return user_can($user, 'view_query_monitor'); // or custom capability
            default:
                return false;
        }
    }

    private function show_consent_screen(string $client_id, string $redirect_uri, string $state, array $scopes): void {
        $user = wp_get_current_user();
        $app_name = $this->get_app_name($client_id);

        // Set content type and start output
        header('Content-Type: text/html; charset=utf-8');

        echo $this->render_consent_page($app_name, $user, $scopes, $client_id, $redirect_uri, $state);
        exit;
    }

    private function get_app_name(string $client_id): string {
        // In a real implementation, this would be stored in the client data
        $app_names = [
            'demo-client' => 'React WordPress OAuth2 Demo'
        ];

        return $app_names[$client_id] ?? 'Third-Party Application';
    }

    private function render_consent_page(string $app_name, WP_User $user, array $scopes, string $client_id, string $redirect_uri, string $state): string {
        $site_name = get_bloginfo('name');
        $user_name = $user->display_name ?: $user->user_login;

        ob_start();
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Authorize <?php echo esc_html($app_name); ?> - <?php echo esc_html($site_name); ?></title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 20px;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .consent-container {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    max-width: 500px;
                    width: 100%;
                    padding: 0;
                    overflow: hidden;
                }
                .header {
                    background: #f8f9fa;
                    padding: 30px;
                    text-align: center;
                    border-bottom: 1px solid #e9ecef;
                }
                .header h1 {
                    margin: 0 0 10px 0;
                    color: #495057;
                    font-size: 24px;
                }
                .app-info {
                    background: #007cba;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                }
                .user-info {
                    color: #6c757d;
                    font-size: 14px;
                    margin-top: 10px;
                }
                .content {
                    padding: 30px;
                }
                .permissions {
                    margin: 20px 0;
                }
                .permissions h3 {
                    margin: 0 0 15px 0;
                    color: #495057;
                    font-size: 16px;
                }
                .permission-item {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 12px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border-left: 3px solid #007cba;
                }
                .permission-icon {
                    color: #007cba;
                    margin-right: 10px;
                    margin-top: 2px;
                }
                .permission-text {
                    flex: 1;
                    font-size: 14px;
                    color: #495057;
                }
                .actions {
                    display: flex;
                    gap: 15px;
                    margin-top: 30px;
                }
                .btn {
                    flex: 1;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-approve {
                    background: #28a745;
                    color: white;
                }
                .btn-approve:hover {
                    background: #218838;
                    transform: translateY(-1px);
                }
                .btn-deny {
                    background: #6c757d;
                    color: white;
                }
                .btn-deny:hover {
                    background: #5a6268;
                }
                .security-note {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 6px;
                    padding: 15px;
                    margin-top: 20px;
                    font-size: 13px;
                    color: #856404;
                }
                .security-note strong {
                    color: #856404;
                }
            </style>
        </head>
        <body>
            <div class="consent-container">
                <div class="header">
                    <h1>🔐 Authorization Request</h1>
                    <div class="app-info"><?php echo esc_html($app_name); ?></div>
                    <div class="user-info">
                        Signed in as <strong><?php echo esc_html($user_name); ?></strong>
                    </div>
                </div>

                <div class="content">
                    <p><strong><?php echo esc_html($app_name); ?></strong> is requesting access to your <strong><?php echo esc_html($site_name); ?></strong> account.</p>

                    <div class="permissions">
                        <h3>This application would like to:</h3>
                        <?php foreach ($scopes as $scope): ?>
                            <div class="permission-item">
                                <span class="permission-icon"><?php echo $this->get_scope_icon($scope); ?></span>
                                <span class="permission-text">
                                    <strong><?php echo esc_html(ucfirst(str_replace('_', ' ', $scope))); ?>:</strong>
                                    <?php echo esc_html(self::AVAILABLE_SCOPES[$scope]); ?>
                                </span>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="security-note">
                        <strong>🛡️ Security Note:</strong> Only approve if you trust this application. You can revoke access at any time from your account settings.
                    </div>

                    <form method="POST" action="">
                        <input type="hidden" name="client_id" value="<?php echo esc_attr($client_id); ?>">
                        <input type="hidden" name="redirect_uri" value="<?php echo esc_attr($redirect_uri); ?>">
                        <input type="hidden" name="state" value="<?php echo esc_attr($state); ?>">
                        <input type="hidden" name="scope" value="<?php echo esc_attr(implode(' ', $scopes)); ?>">

                        <div class="actions">
                            <button type="submit" name="oauth2_consent" value="deny" class="btn btn-deny">
                                ❌ Deny Access
                            </button>
                            <button type="submit" name="oauth2_consent" value="approve" class="btn btn-approve">
                                ✅ Allow Access
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    private function get_scope_icon(string $scope): string {
        $icons = [
            'read' => '👁️',
            'write' => '✏️',
            'delete' => '🗑️',
            'manage_users' => '👥',
            'upload_files' => '📁',
            'edit_theme' => '🎨',
            'moderate_comments' => '💬',
            'view_stats' => '📊'
        ];

        return $icons[$scope] ?? '🔧';
    }

    private function handle_consent_response(string $client_id, string $redirect_uri, string $state, array $scopes, int $user_id): void {
        $consent = $_POST['oauth2_consent'] ?? '';

        error_log('OAuth2 Debug: Handling consent response - ' . json_encode([
            'consent' => $consent,
            'client_id' => $client_id,
            'redirect_uri' => $redirect_uri,
            'state' => $state,
            'scopes' => $scopes,
            'user_id' => $user_id
        ]));

        if ($consent !== 'approve') {
            error_log('OAuth2 Debug: Access denied by user');
            $this->redirect_with_error($redirect_uri, 'access_denied', $state);
            return;
        }

        // Generate authorization code
        $code = wp_auth_multi_generate_token(32);

        // Store authorization code with approved scopes
        set_transient($this->code_key($code), [
            'client_id' => $client_id,
            'user_id' => $user_id,
            'redirect_uri' => $redirect_uri,
            'scopes' => $scopes,
            'created' => time()
        ], self::CODE_TTL);

        // Redirect back to application with authorization code
        $location = add_query_arg(array_filter([
            'code' => $code,
            'state' => $state
        ]), $redirect_uri);

        error_log('OAuth2 Debug: Redirecting to callback with code - ' . json_encode([
            'code' => substr($code, 0, 10) . '...',
            'state' => $state,
            'redirect_location' => $location
        ]));

        wp_redirect($location);
        exit;
    }

    private function redirect_with_error(?string $redirect_uri, string $error, ?string $state): void {
        if (!$redirect_uri) {
            wp_die("OAuth2 error: $error");
        }

        $params = array_filter([
            'error' => $error,
            'state' => $state
        ]);

        $location = add_query_arg($params, $redirect_uri);
        wp_redirect($location);
        exit;
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
            wp_redirect($login_url);
            exit;
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

        wp_redirect($location);
        exit;
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
        $approved_scopes = $code_data['scopes'] ?? ['read'];

        // Store access token with approved scopes
        set_transient($this->token_key($access_token), [
            'user_id' => $code_data['user_id'],
            'client_id' => $client_id,
            'scopes' => $approved_scopes,
            'created' => time()
        ], self::TOKEN_TTL);

        return [
            'access_token' => $access_token,
            'token_type' => 'Bearer',
            'expires_in' => self::TOKEN_TTL,
            'scope' => implode(' ', $approved_scopes)
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

        // Get scopes from the current access token
        $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = '';
        if (stripos($auth_header, 'Bearer ') === 0) {
            $token = trim(substr($auth_header, 7));
        }

        $token_data = get_transient($this->token_key($token));
        $granted_scopes = $token_data['scopes'] ?? ['read'];

        // Build response based on granted scopes
        $response = [
            'sub' => (string)$user->ID,
            'granted_scopes' => $granted_scopes
        ];

        // Add user info only if 'read' scope is granted
        if (in_array('read', $granted_scopes)) {
            $response = array_merge($response, [
                'username' => $user->user_login,
                'email' => $user->user_email,
                'name' => $user->display_name,
                'roles' => array_values($user->roles)
            ]);
        }

        // Add management info if 'manage_users' scope is granted
        if (in_array('manage_users', $granted_scopes) && user_can($user, 'list_users')) {
            $response['capabilities'] = [
                'can_manage_users' => true,
                'can_edit_users' => user_can($user, 'edit_users'),
                'can_create_users' => user_can($user, 'create_users')
            ];
        }

        return $response;
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

        wp_redirect($location);
        exit;
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