from routers.auth import router as auth_router
from routers.zendesk import router as zendesk_router
from routers.atlas import router as atlas_router
from routers.t2220 import router as t2220_router
from routers.jira import router as jira_router
from routers.users import router as users_router

__all__ = [
    "auth_router",
    "zendesk_router",
    "atlas_router",
    "t2220_router",
    "jira_router",
    "users_router",
]
