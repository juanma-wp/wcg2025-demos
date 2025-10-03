<?php

/**
 * Plugin Name: WP REST Auth Demo - WordCamp Galicia 2025
 * Plugin URI: https://galicia.wordcamp.org/2025/
 * Description: Plugin de demostración para la charla "Hablando con WordPress desde fuera: autenticación y acceso a datos". Muestra cómo crear custom endpoints protegidos y modificar endpoints existentes
 * Version: 1.0.0
 * Author: Juan Manuel Garrido
 * Author URI: https://github.com/juanma-wp
 * Requires at least: 5.6
 * Requires PHP: 7.4
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wp-rest-auth-demo
 */

if (!defined('ABSPATH')) {
    exit;
}

define('WP_REST_AUTH_DEMO_VERSION', '1.0.0');
define('WP_REST_AUTH_DEMO_PLUGIN_DIR', plugin_dir_path(__FILE__));

/**
 * Main plugin class for WP REST Auth Demo.
 *
 * Este plugin demuestra tres conceptos clave:
 * 1. Cómo crear custom endpoints protegidos por autenticación
 * 2. Cómo modificar/extender endpoints existentes de WordPress
 * 3. Cómo la autenticación JWT/OAuth2 se aplica automáticamente a todos los endpoints
 */
class WP_REST_Auth_Demo
{

    /**
     * Constructor - registra hooks principales
     */
    public function __construct()
    {
        add_action('rest_api_init', [$this, 'register_custom_endpoints']);
        add_action('rest_api_init', [$this, 'modify_existing_endpoints']);
        add_action('init', [$this, 'register_post_meta']);
    }

    /**
     * DEMO 1: Custom Endpoints Protegidos
     *
     * Estos endpoints demuestran diferentes niveles de protección:
     * - Público (sin autenticación)
     * - Requiere autenticación
     * - Requiere capacidades específicas
     */
    public function register_custom_endpoints()
    {

        // Endpoint PÚBLICO - No requiere autenticación
        register_rest_route('wcg2025/v1', '/public/stats', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_public_stats'],
            'permission_callback' => '__return_true', // Público
        ]);

        // Endpoint PROTEGIDO - Requiere autenticación (JWT o OAuth2)
        register_rest_route('wcg2025/v1', '/protected/user-data', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_user_data'],
            'permission_callback' => function () {
                // Este callback verifica que el usuario esté autenticado
                // La autenticación la manejan los plugins JWT/OAuth2 automáticamente
                return is_user_logged_in();
            },
        ]);

        // Endpoint PROTEGIDO CON CAPACIDADES - Solo editores o superiores
        register_rest_route('wcg2025/v1', '/protected/editor-only', [
            'methods'  => 'POST',
            'callback' => [$this, 'create_featured_content'],
            'permission_callback' => function () {
                return current_user_can('edit_pages');
            },
            'args' => [
                'title' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'content' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'wp_kses_post',
                ],
            ],
        ]);

        // Endpoint PROTEGIDO - Información sensible del usuario actual
        register_rest_route('wcg2025/v1', '/protected/my-drafts', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_user_drafts'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ]);

        // Endpoint PROTEGIDO - Actualizar datos del perfil
        register_rest_route('wcg2025/v1', '/protected/profile', [
            'methods'  => 'PUT',
            'callback' => [$this, 'update_profile'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
            'args' => [
                'bio' => [
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_textarea_field',
                ],
                'website' => [
                    'type' => 'string',
                    'sanitize_callback' => 'esc_url_raw',
                ],
            ],
        ]);
    }

    /**
     * DEMO 2: Modificar Endpoints Existentes
     *
     * Demuestra cómo añadir campos personalizados a endpoints estándar de WordPress
     */
    public function modify_existing_endpoints()
    {

        // Añadir campo personalizado "reading_time" a posts
        register_rest_field('post', 'reading_time', [
            'get_callback' => [$this, 'get_reading_time'],
            'schema' => [
                'description' => 'Tiempo estimado de lectura en minutos',
                'type' => 'integer',
            ],
        ]);

        // Añadir campo personalizado "author_bio" a posts
        register_rest_field('post', 'author_bio', [
            'get_callback' => [$this, 'get_author_bio'],
            'schema' => [
                'description' => 'Biografía del autor del post',
                'type' => 'string',
            ],
        ]);

        // Añadir campo personalizado editable "view_count" (solo con autenticación)
        register_rest_field('post', 'view_count', [
            'get_callback' => [$this, 'get_view_count'],
            'update_callback' => [$this, 'update_view_count'],
            'schema' => [
                'description' => 'Número de veces que se ha visto el post',
                'type' => 'integer',
            ],
        ]);
    }

    /**
     * Registrar post meta necesario para los campos personalizados
     */
    public function register_post_meta()
    {
        register_post_meta('post', 'view_count', [
            'type' => 'integer',
            'single' => true,
            'default' => 0,
            'show_in_rest' => false, // Lo manejamos nosotros
        ]);
    }

    // ============================================
    // CALLBACKS PARA CUSTOM ENDPOINTS
    // ============================================

    /**
     * Endpoint público - Estadísticas generales del sitio
     */
    public function get_public_stats($request)
    {
        $stats = [
            'total_posts' => wp_count_posts('post')->publish,
            'total_pages' => wp_count_posts('page')->publish,
            'total_users' => count_users()['total_users'],
            'wordpress_version' => get_bloginfo('version'),
            'site_name' => get_bloginfo('name'),
            'authentication_status' => is_user_logged_in() ? 'authenticated' : 'public',
        ];

        return rest_ensure_response($stats);
    }

    /**
     * Endpoint protegido - Datos del usuario autenticado
     *
     * IMPORTANTE: Este endpoint funciona tanto con JWT como con OAuth2
     * porque WordPress ya ha autenticado al usuario antes de llegar aquí.
     */
    public function get_user_data($request)
    {
        $user = wp_get_current_user();

        // Preparar respuesta con datos del usuario
        $user_data = [
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'display_name' => $user->display_name,
            'roles' => $user->roles,
            'capabilities' => array_keys(array_filter($user->allcaps)),
            'registered' => $user->user_registered,
            'posts_count' => count_user_posts($user->ID),
            'auth_method' => $this->get_auth_method(),
        ];

        return rest_ensure_response($user_data);
    }

    /**
     * Endpoint protegido - Crear contenido destacado (solo editores+)
     */
    public function create_featured_content($request)
    {
        $title = $request->get_param('title');
        $content = $request->get_param('content');

        // Crear el post
        $post_id = wp_insert_post([
            'post_title' => $title,
            'post_content' => $content,
            'post_status' => 'draft',
            'post_author' => get_current_user_id(),
            'post_type' => 'post',
        ]);

        if (is_wp_error($post_id)) {
            return new WP_Error(
                'create_failed',
                'No se pudo crear el contenido',
                ['status' => 500]
            );
        }

        // Marcar como destacado
        update_post_meta($post_id, '_is_featured', 1);

        return rest_ensure_response([
            'success' => true,
            'post_id' => $post_id,
            'message' => 'Contenido destacado creado exitosamente',
            'edit_url' => admin_url('post.php?post=' . $post_id . '&action=edit'),
        ]);
    }

    /**
     * Endpoint protegido - Obtener borradores del usuario
     */
    public function get_user_drafts($request)
    {
        $user_id = get_current_user_id();

        $drafts = get_posts([
            'author' => $user_id,
            'post_status' => 'draft',
            'posts_per_page' => -1,
        ]);

        $formatted_drafts = array_map(function ($post) {
            return [
                'id' => $post->ID,
                'title' => $post->post_title,
                'excerpt' => wp_trim_words($post->post_content, 20),
                'modified' => $post->post_modified,
                'edit_url' => admin_url('post.php?post=' . $post->ID . '&action=edit'),
            ];
        }, $drafts);

        return rest_ensure_response([
            'total' => count($formatted_drafts),
            'drafts' => $formatted_drafts,
        ]);
    }

    /**
     * Endpoint protegido - Actualizar perfil del usuario
     */
    public function update_profile($request)
    {
        $user_id = get_current_user_id();
        $bio = $request->get_param('bio');
        $website = $request->get_param('website');

        $updated = [];

        if ($bio !== null) {
            update_user_meta($user_id, 'description', $bio);
            $updated[] = 'bio';
        }

        if ($website !== null) {
            wp_update_user([
                'ID' => $user_id,
                'user_url' => $website,
            ]);
            $updated[] = 'website';
        }

        return rest_ensure_response([
            'success' => true,
            'updated_fields' => $updated,
            'message' => 'Perfil actualizado correctamente',
        ]);
    }

    // ============================================
    // CALLBACKS PARA CAMPOS PERSONALIZADOS
    // ============================================

    /**
     * Calcular tiempo de lectura estimado
     */
    public function get_reading_time($post)
    {
        $content = get_post_field('post_content', $post['id']);
        $word_count = str_word_count(strip_tags($content));
        $minutes = ceil($word_count / 200); // ~200 palabras por minuto

        return max(1, $minutes);
    }

    /**
     * Obtener biografía del autor
     */
    public function get_author_bio($post)
    {
        $author_id = $post['author'];
        return get_the_author_meta('description', $author_id);
    }

    /**
     * Obtener contador de vistas
     */
    public function get_view_count($post)
    {
        $count = get_post_meta($post['id'], 'view_count', true);
        return $count ? (int) $count : 0;
    }

    /**
     * Actualizar contador de vistas (requiere autenticación)
     */
    public function update_view_count($value, $post)
    {
        // Solo usuarios autenticados pueden actualizar el contador
        if (!is_user_logged_in()) {
            return new WP_Error(
                'rest_forbidden',
                'Solo usuarios autenticados pueden actualizar el contador de vistas',
                ['status' => 401]
            );
        }

        // Validar que el valor sea un número positivo
        $value = absint($value);

        return update_post_meta($post->ID, 'view_count', $value);
    }

    // ============================================
    // UTILIDADES
    // ============================================

    /**
     * Detectar el método de autenticación usado
     *
     * Esto es útil para debugging y demostración
     */
    private function get_auth_method()
    {
        if (!is_user_logged_in()) {
            return 'none';
        }

        // Detectar si hay un token Bearer en la petición
        $auth_header = '';

        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['Authorization'])) {
            $auth_header = $_SERVER['Authorization'];
        }

        if (stripos($auth_header, 'Bearer ') === 0) {
            // Intentar determinar si es JWT o OAuth2 mirando el token
            $token = substr($auth_header, 7);

            // JWT tokens tienen el formato xxx.yyy.zzz (3 partes separadas por puntos)
            if (substr_count($token, '.') === 2) {
                return 'jwt';
            }

            return 'oauth2';
        }

        // Si no hay bearer token, es autenticación de cookie/sesión
        return 'cookie';
    }
}

// Inicializar el plugin
new WP_REST_Auth_Demo();
