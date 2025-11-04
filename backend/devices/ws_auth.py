from urllib.parse import parse_qs
from typing import Callable
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from channels.middleware import BaseMiddleware
from asgiref.sync import sync_to_async


@sync_to_async
def get_user_from_token(token_str: str):
    try:
        token = AccessToken(token_str)
        user_id = token.get("user_id")
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.get(id=user_id)
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """Channels middleware that authenticates via JWT in header or query string.

    Reads token from 'Authorization: Bearer <token>' header or query '?token=<token>'.
    Sets scope['user'] accordingly.
    """

    async def __call__(self, scope, receive, send):
        # Default to anonymous
        scope["user"] = AnonymousUser()

        # Extract from headers
        headers = dict(scope.get("headers", []))
        auth_header = None
        if b"authorization" in headers:
            auth_header = headers[b"authorization"].decode()
        elif b"Authorization" in headers:
            auth_header = headers[b"Authorization"].decode()

        token_str = None
        if auth_header and auth_header.lower().startswith("bearer "):
            token_str = auth_header.split(" ", 1)[1].strip()
        else:
            # Try query string
            query_string = scope.get("query_string", b"").decode()
            qs = parse_qs(query_string)
            token_values = qs.get("token")
            if token_values:
                token_str = token_values[0]
        
        if token_str:
            user = await get_user_from_token(token_str)
            scope["user"] = user

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner: Callable):
    return JWTAuthMiddleware(inner)