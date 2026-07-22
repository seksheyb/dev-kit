---
name: laravel-specialist
description: Build and configure Laravel applications across Laravel 10 through 13, including creating Eloquent models and relationships, implementing Sanctum authentication, configuring Horizon queues, designing RESTful APIs with API resources, and building reactive interfaces with Livewire. Use when creating Laravel models, setting up queue workers, implementing Sanctum auth flows, building Livewire components, optimising Eloquent queries, or writing Pest/PHPUnit tests for Laravel features.
license: MIT
metadata:
  version: "1.2.0"
  domain: backend
  triggers: Laravel, Eloquent, PHP framework, Laravel API, Artisan, Blade templates, Laravel queues, Livewire, Laravel testing, Sanctum, Horizon
  role: specialist
  scope: implementation
  output-format: code
  related-skills: fullstack-guardian, test-master, devops-engineer, security-reviewer
---

# Laravel Specialist

Senior Laravel specialist with deep expertise in Eloquent ORM and modern PHP 8.3+ development.

## Core Workflow

1. **Detect the version** — Check `composer.lock` for the installed `laravel/framework` and PHP constraint before writing code. Target Laravel 12/13 conventions for new work (PHP 8.3+, no `app/Http/Kernel.php`), but don't force 13-only idioms onto an older app — a 10.x or 11.x app is still valid and needs matching-era advice.
2. **Analyse requirements** — Identify models, relationships, APIs, and queue needs
3. **Design architecture** — Plan database schema, service layers, and job queues
4. **Implement models** — Create Eloquent models with relationships, scopes, and casts; run `php artisan make:model` and verify with `php artisan migrate:status`
5. **Build features** — Develop controllers, services, API resources, and jobs; run `php artisan route:list` to verify routing
6. **Test thoroughly** — Write feature and unit tests; run `php artisan test` before considering any step complete (target >85% coverage)

## Reference Guide

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Eloquent ORM | `references/eloquent.md` | Models, relationships, scopes, query optimization |
| Routing & APIs | `references/routing.md` | Routes, controllers, middleware, API resources |
| Queue System | `references/queues.md` | Jobs, workers, Horizon, failed jobs, batching |
| Livewire | `references/livewire.md` | Components, wire:model, actions, real-time |
| Testing | `references/testing.md` | Feature tests, factories, mocking, Pest PHP |

## Constraints

### MUST DO
- Use PHP 8.3+ features (readonly, enums, typed properties); prefer PHP 8.4 property hooks and asymmetric visibility (`public private(set)`) when the project's PHP floor allows it
- Type hint all method parameters and return types
- Use Eloquent relationships properly (avoid N+1 with eager loading)
- Implement API resources for transforming data
- Queue long-running tasks
- Write comprehensive tests (>85% coverage)
- Use service containers and dependency injection
- Follow PSR-12 coding standards

### MUST NOT DO
- Use raw queries without protection (SQL injection)
- Skip eager loading (causes N+1 problems)
- Store sensitive data unencrypted
- Mix business logic in controllers
- Hardcode configuration values
- Skip validation on user input
- Use deprecated Laravel features
- Ignore queue failures

## Code Templates

Use these as starting points for every implementation.

### Eloquent Model

```php
<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

final class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['title', 'body', 'status', 'user_id'];

    protected $casts = [
        'status' => PostStatus::class, // backed enum
        'published_at' => 'immutable_datetime',
    ];

    // Relationships — always eager-load via ::with() at call site
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // Local scope
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', PostStatus::Published);
    }
}
```

### Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('body');
            $table->string('status')->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
```

### API Resource

```php
<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'title'        => $this->title,
            'body'         => $this->body,
            'status'       => $this->status->value,
            'published_at' => $this->published_at?->toIso8601String(),
            'author'       => new UserResource($this->whenLoaded('author')),
            'comments'     => CommentResource::collection($this->whenLoaded('comments')),
        ];
    }
}
```

### Queued Job

```php
<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Post;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class PublishPost implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        private readonly Post $post,
    ) {}

    public function handle(): void
    {
        $this->post->update([
            'status'       => PostStatus::Published,
            'published_at' => now(),
        ]);
    }

    public function failed(\Throwable $e): void
    {
        // Log or notify — never silently swallow failures
        logger()->error('PublishPost failed', ['post' => $this->post->id, 'error' => $e->getMessage()]);
    }
}
```

### Feature Test (Pest)

```php
<?php

use App\Models\Post;
use App\Models\User;

it('returns a published post for authenticated users', function (): void {
    $user = User::factory()->create();
    $post = Post::factory()->published()->for($user, 'author')->create();

    $response = $this->actingAs($user)
        ->getJson("/api/posts/{$post->id}");

    $response->assertOk()
        ->assertJsonPath('data.status', 'published')
        ->assertJsonPath('data.author.id', $user->id);
});

it('queues a publish job when a draft is submitted', function (): void {
    Queue::fake();
    $user = User::factory()->create();
    $post = Post::factory()->draft()->for($user, 'author')->create();

    $this->actingAs($user)
        ->postJson("/api/posts/{$post->id}/publish")
        ->assertAccepted();

    Queue::assertPushed(PublishPost::class, fn ($job) => $job->post->is($post));
});
```

## Validation Checkpoints

Run these at each workflow stage to confirm correctness before proceeding:

| Stage | Command | Expected Result |
|-------|---------|-----------------|
| After migration | `php artisan migrate:status` | All migrations show `Ran` |
| After routing | `php artisan route:list --path=api` | New routes appear with correct verbs |
| After job dispatch | `php artisan queue:work --once` | Job processes without exception |
| After implementation | `php artisan test --coverage` | >85% coverage, 0 failures |
| Before PR | `./vendor/bin/pint --test` | PSR-12 linting passes |

## Knowledge Reference

Laravel 10–13, Eloquent ORM, PHP 8.3+/8.4, API resources, Sanctum/Passport (with passkey/WebAuthn support in Laravel 13), queues, Horizon, Livewire 3, Inertia, Octane (FrankenPHP or Swoole), Pest 4/PHPUnit, Redis, broadcasting, events/listeners, notifications, task scheduling

