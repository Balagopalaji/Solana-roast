# Core Infrastructure Components

## Event System

The event system provides a distributed event bus using Redis pub/sub for handling application-wide events.

### Components

#### 1. Base Event Service
- Abstract base class for event handling
- Redis pub/sub integration
- Type-safe event handling
- Error handling and logging

```typescript
// Example usage:
const event: RoastEvent = {
  type: EventType.ROAST_GENERATED,
  payload: {
    walletAddress: '0x123',
    roastText: 'Test roast',
    timestamp: Date.now()
  },
  source: 'roast_service'
};

await eventBus.publishEvent(event);
```

#### 2. Event Types
- Strongly typed event definitions
- Clear categorization (Roast, Twitter, Analytics)
- Payload type safety

### Event Categories

1. **Roast Events**
   - `ROAST_GENERATED`
   - `ROAST_SHARED`

2. **Twitter Events**
   - `TWITTER_SHARE_STARTED`
   - `TWITTER_SHARE_COMPLETED`
   - `TWITTER_SHARE_FAILED`
   - `TWITTER_AUTH_STARTED`
   - `TWITTER_AUTH_COMPLETED`
   - `TWITTER_AUTH_FAILED`

3. **Analytics Events**
   - `WALLET_ROASTED`
   - `LEADERBOARD_UPDATED`

## Storage System

The storage system provides a secure, distributed storage solution using Redis.

### Components

#### 1. Base Storage Service
- Abstract base class for storage operations
- Type-safe storage operations
- Validation and error handling
- Logging integration

#### 2. Redis Storage
- Redis-based implementation
- TTL support
- Pattern-based listing
- Additional Redis-specific operations

```typescript
// Example usage:
const storage = new RedisStorage<UserData>({ prefix: 'users' });
await storage.set('user123', { name: 'John', email: 'john@example.com' });
```

#### 3. Secure Storage
- Encryption layer over Redis storage
- AES-256-GCM encryption
- Key rotation support
- Secure token storage

```typescript
// Example usage:
const storage = new SecureStorage<TokenData>({ prefix: 'tokens' });
await storage.set('user123', { accessToken: 'secret', refreshToken: 'secret' });
```

### Security Features

1. **Encryption**
   - AES-256-GCM algorithm
   - Initialization vectors (IV)
   - Authentication tags
   - Key rotation support

2. **Data Validation**
   - Key validation
   - Value validation
   - Type safety

## Environment Requirements

### Redis
```env
REDIS_URL=redis://localhost:6379
```

### Encryption
```env
ENCRYPTION_KEY=<64-character-hex-string>  # 32 bytes in hex format
```

## Best Practices

### Event System
1. Always use typed events
2. Handle event errors gracefully
3. Include proper metadata
4. Use meaningful source identifiers

### Storage System
1. Use appropriate storage type (Redis vs Secure)
2. Implement proper error handling
3. Use prefixes to namespace data
4. Rotate encryption keys periodically

## Testing

### Event System Tests
```bash
npm test -- services/events
```

### Storage System Tests
```bash
npm test -- services/storage
```

## Monitoring

### Event Metrics
- Event throughput
- Error rates
- Handler latency
- Redis pub/sub health

### Storage Metrics
- Operation latency
- Error rates
- Storage usage
- Encryption performance

## Error Handling

### Event System
- Redis connection errors
- Event validation errors
- Handler errors
- Serialization errors

### Storage System
- Redis connection errors
- Encryption/decryption errors
- Validation errors
- Key rotation errors

## Future Enhancements

1. **Event System**
   - Event replay capability
   - Dead letter queue
   - Event versioning
   - Event schema validation

2. **Storage System**
   - Backup/restore functionality
   - Compression support
   - Cache layer
   - Batch operations

## Contributing

When adding new features:

1. Follow existing patterns
2. Add comprehensive tests
3. Update documentation
4. Consider backward compatibility 