"""Business errors and the exception handlers that render the envelope."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.exc import StaleDataError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.envelope import failure
from app.trace import get_trace_id

logger = logging.getLogger("orange.errors")

PARAM_ERROR = 40001
VALIDATE_ERROR = 40002
UNAUTHORIZED = 40101
AUTH_DENIED = 40301
PASSWORD_CHANGE_REQUIRED = 40302
NOT_FOUND = 40401
METHOD_NOT_ALLOWED = 40501
CONFLICT = 40901
SYSTEM_ERROR = 50000

ERROR_MESSAGES: dict[int, str] = {
    PARAM_ERROR: "参数错误",
    VALIDATE_ERROR: "校验失败",
    UNAUTHORIZED: "未登录",
    AUTH_DENIED: "无权限",
    PASSWORD_CHANGE_REQUIRED: "请先修改初始密码",
    NOT_FOUND: "数据不存在",
    METHOD_NOT_ALLOWED: "方法不允许",
    CONFLICT: "数据冲突",
    SYSTEM_ERROR: "系统异常",
}

HTTP_STATUS: dict[int, int] = {
    200: 200,
    PARAM_ERROR: 400,
    VALIDATE_ERROR: 400,
    UNAUTHORIZED: 401,
    AUTH_DENIED: 403,
    PASSWORD_CHANGE_REQUIRED: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    429: 429,
    SYSTEM_ERROR: 500,
}


class ApiError(Exception):
    """A business failure carrying its own envelope code and HTTP status."""

    def __init__(
        self,
        message: str | None = None,
        code: int = VALIDATE_ERROR,
        http_status: int | None = None,
        data: Any = None,
    ) -> None:
        self.code = code
        self.message = message or ERROR_MESSAGES.get(code, "校验失败")
        self.http_status = http_status if http_status is not None else HTTP_STATUS.get(code, 400)
        self.data = data
        super().__init__(self.message)


def invalid(message: str) -> ApiError:
    return ApiError(message, VALIDATE_ERROR)


def bad_request(message: str = ERROR_MESSAGES[PARAM_ERROR]) -> ApiError:
    return ApiError(message, PARAM_ERROR)


def not_found(message: str) -> ApiError:
    return ApiError(message, NOT_FOUND)


def conflict(message: str) -> ApiError:
    return ApiError(message, CONFLICT)


def unauthorized(message: str = ERROR_MESSAGES[UNAUTHORIZED]) -> ApiError:
    return ApiError(message, UNAUTHORIZED)


def forbidden(message: str = ERROR_MESSAGES[AUTH_DENIED]) -> ApiError:
    return ApiError(message, AUTH_DENIED)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(request: Request, exc: ApiError):  # noqa: ANN202
        logger.warning("business error [%s] traceId=%s: %s", exc.code, get_trace_id(), exc.message)
        return failure(exc.code, exc.message, exc.http_status, exc.data)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(request: Request, exc: RequestValidationError):  # noqa: ANN202
        raw_errors = exc.errors()
        if any(error.get("type") == "json_invalid" for error in raw_errors):
            logger.warning("malformed json traceId=%s", get_trace_id())
            return failure(PARAM_ERROR, ERROR_MESSAGES[PARAM_ERROR], 400)

        fields: dict[str, str] = {}
        for error in raw_errors:
            location = [str(part) for part in error.get("loc", ())]
            if location and location[0] in {"body", "query", "path", "header", "cookie"}:
                location = location[1:]
            name = ".".join(location) or "request"
            message = error.get("msg") or "invalid value"
            fields.setdefault(name, message)
        logger.warning("validation failed traceId=%s: %s", get_trace_id(), fields)
        return failure(VALIDATE_ERROR, ERROR_MESSAGES[VALIDATE_ERROR], 400, fields)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(request: Request, exc: StarletteHTTPException):  # noqa: ANN202
        status = exc.status_code
        code = {
            400: PARAM_ERROR,
            401: UNAUTHORIZED,
            403: AUTH_DENIED,
            404: NOT_FOUND,
            405: METHOD_NOT_ALLOWED,
            409: CONFLICT,
        }.get(status, SYSTEM_ERROR if status >= 500 else PARAM_ERROR)
        message = ERROR_MESSAGES.get(code, "参数错误")
        if isinstance(exc.detail, str) and exc.detail and exc.detail != "Not Found":
            message = exc.detail
        return failure(code, message, HTTP_STATUS.get(code, status))

    @app.exception_handler(IntegrityError)
    async def _integrity_error(request: Request, exc: IntegrityError):  # noqa: ANN202
        logger.warning("data conflict traceId=%s: %s", get_trace_id(), exc)
        return failure(CONFLICT, "数据冲突，请刷新后重试", 409)

    @app.exception_handler(StaleDataError)
    async def _stale_data(request: Request, exc: StaleDataError):  # noqa: ANN202
        logger.warning("optimistic lock conflict traceId=%s: %s", get_trace_id(), exc)
        return failure(CONFLICT, "数据冲突，请刷新后重试", 409)

    @app.exception_handler(Exception)
    async def _unhandled_error(request: Request, exc: Exception):  # noqa: ANN202
        trace_id = getattr(request.state, "trace_id", None) or get_trace_id()
        logger.exception("unhandled exception traceId=%s", trace_id, exc_info=exc)
        return failure(
            SYSTEM_ERROR, ERROR_MESSAGES[SYSTEM_ERROR], 500, trace_id=trace_id
        )
