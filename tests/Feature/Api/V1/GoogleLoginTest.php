<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use App\Services\Auth\GoogleIdentityVerifier;
use Firebase\JWT\JWT;
use Google\AccessToken\Verify;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoogleLoginTest extends TestCase
{
    use RefreshDatabase;
    private $key;
    private array $claims;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.google.mobile_audiences' => ['mobile-client']]);
        $this->key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        $details = openssl_pkey_get_details($this->key);
        $b64 = fn ($v) => rtrim(strtr(base64_encode($v), '+/', '-_'), '=');
        $jwks = ['keys' => [['kty' => 'RSA', 'kid' => 'test', 'alg' => 'RS256', 'n' => $b64($details['rsa']['n']), 'e' => $b64($details['rsa']['e'])]]];
        $http = new Client(['handler' => HandlerStack::create(new MockHandler([new Response(200, [], json_encode($jwks))]))]);
        $this->app->instance(Verify::class, new Verify($http));
        $this->claims = ['iss' => 'https://accounts.google.com', 'aud' => 'mobile-client', 'exp' => time() + 3600, 'iat' => time(), 'sub' => 'google-sub', 'email' => 'mobile@example.test', 'email_verified' => true, 'name' => 'Learner'];
    }

    private function login(array $claims = [], $key = null)
    {
        return $this->postJson('/api/v1/auth/google', ['id_token' => JWT::encode(array_replace($this->claims, $claims), $key ?? $this->key, 'RS256', 'test'), 'device_name' => 'Android']);
    }

    public function test_verified_identity_creates_learner_token_and_reuses_provider_subject(): void
    {
        $response = $this->login()->assertOk()->assertJsonPath('data.tokenType', 'Bearer');
        $id = $response->json('data.user.id');
        $this->assertEqualsWithDelta(30, now()->diffInDays(\Laravel\Sanctum\PersonalAccessToken::first()->expires_at, false), 0.001);
        $this->login(['email' => 'changed@example.test'])->assertOk()->assertJsonPath('data.user.id', $id);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('oauth_accounts', 1);
        $this->assertFalse(User::first()->is_admin);
    }

    public function test_unlinked_same_email_requires_explicit_linking(): void
    {
        User::factory()->create(['email' => 'mobile@example.test']);
        $this->login()->assertConflict()->assertJsonPath('error.code', 'account_link_required');
        $this->assertDatabaseCount('oauth_accounts', 0);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_bad_signature_issuer_audience_expiry_and_unverified_email_are_rejected(): void
    {
        foreach ([['iss' => 'https://evil.test'], ['aud' => 'other'], ['exp' => time() - 60], ['email_verified' => false], ['sub' => ''], ['exp' => null]] as $claims) {
            $this->login($claims)->assertUnauthorized()->assertJsonPath('error.code', 'invalid_google_token');
        }
        $other = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        $this->login([], $other)->assertUnauthorized();
        $this->assertDatabaseCount('users', 0);
    }

    public function test_missing_allowlist_fails_closed_and_malformed_requests_are_json(): void
    {
        config(['services.google.mobile_audiences' => []]);
        $this->login()->assertUnauthorized();
        $this->postJson('/api/v1/auth/google', [])->assertUnprocessable()->assertJsonStructure(['error' => ['fields' => ['id_token', 'device_name']], 'meta' => ['requestId']]);
    }
}
