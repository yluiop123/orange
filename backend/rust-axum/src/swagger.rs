//! Swagger UI and the repository-wide OpenAPI contract.
//!
//! Both handlers are plain top-level routes: no `require_auth` layer wraps them, so
//! they stay anonymous. The contract is read once with `std::fs` and cached in a
//! `OnceLock`; a missing file is logged and turns `/openapi.json` into a 500.

use std::path::PathBuf;
use std::sync::{Arc, OnceLock};

use axum::body::Body;
use axum::http::{header, HeaderValue, StatusCode};
use axum::response::{Html, IntoResponse, Response};

const SWAGGER_HTML: &str = r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orange API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      persistAuthorization: true,
      docExpansion: 'none'
    });
  </script>
</body>
</html>
"#;

static CONTRACT: OnceLock<Option<Arc<str>>> = OnceLock::new();

/// Loads the contract at startup so a missing file is reported in the startup log
/// instead of only on the first request.
pub fn warm_cache() {
    if CONTRACT.get_or_init(load_contract).is_none() {
        tracing::error!(
            "contracts/openapi.json was not found within 5 parent directories of the working directory; GET /openapi.json will return 500"
        );
    }
}

/// `GET /openapi.json` - returns the raw contract bytes with an application/json type.
pub async fn openapi_json() -> Response {
    match CONTRACT.get_or_init(load_contract).as_deref() {
        Some(json) => {
            let mut response = Response::new(Body::from(json.to_string()));
            response.headers_mut().insert(
                header::CONTENT_TYPE,
                HeaderValue::from_static("application/json"),
            );
            response
        }
        None => {
            tracing::error!(
                "GET /openapi.json: contracts/openapi.json is unavailable; returning 500"
            );
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

/// `GET /swagger` - Swagger UI 5 loaded from unpkg, pointing at `/openapi.json`.
pub async fn swagger_ui() -> Html<&'static str> {
    Html(SWAGGER_HTML)
}

fn load_contract() -> Option<Arc<str>> {
    let path = find_contract()?;
    match std::fs::read_to_string(&path) {
        Ok(json) => {
            tracing::info!(path = %path.display(), "OpenAPI contract loaded");
            Some(Arc::from(json))
        }
        Err(error) => {
            tracing::error!(
                path = %path.display(),
                error = %error,
                "failed to read the OpenAPI contract"
            );
            None
        }
    }
}

/// Walks up from the process cwd, checking the cwd itself plus at most five parents.
fn find_contract() -> Option<PathBuf> {
    let mut directory = std::env::current_dir().ok()?;
    for _ in 0..=5 {
        let candidate = directory.join("contracts").join("openapi.json");
        if candidate.is_file() {
            return Some(candidate);
        }
        if !directory.pop() {
            return None;
        }
    }
    None
}
