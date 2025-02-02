# SolanaRoast.lol API Documentation

## Roast Generation

### POST /api/roast

Generate a roast for a Solana wallet address.

#### Request
```json
{
  "walletAddress": "string (required) - Valid Solana wallet address"
}
```

#### Response
```json
{
  "roast": "string - Generated roast text",
  "meme_url": "string - URL to generated meme image",
  "wallet": {
    "address": "string - Wallet address",
    "balance": "number - SOL balance",
    "nftCount": "number - Number of NFTs",
    "transactionCount": "number - Number of transactions",
    "lastActivity": "string? - ISO date of last activity"
  }
}
```

#### Error Responses
- 400: Invalid request (missing or invalid fields)
- 500: Server error (generation failed)

## Error Responses

All error responses follow this format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable error message",
  "details": "Optional additional error details",
  "timestamp": "ISO timestamp of when the error occurred"
}
```

### Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `OPENAI_ERROR`: OpenAI API error
- `SOLANA_ERROR`: Solana RPC or wallet error
- `FIREBASE_ERROR`: Firebase operation error
- `UNKNOWN_ERROR`: Unhandled server error

### Common Status Codes
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 429: Too Many Requests
- 500: Internal Server Error

### Validation Errors (400)
```json
{
  "error": "Invalid request",
  "details": "Missing required fields: walletAddress"
}
```

Common validation errors:
- Missing wallet address
- Invalid wallet address format
- Malformed request body 