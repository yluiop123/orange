//! ORANGE backend - Rust + Axum.
//!
//! Port 8083, API base `/api/v1`, PostgreSQL schema and seed from
//! `database/postgres`.

mod auth;
mod config;
mod domain;
mod error;
mod middleware;
mod operation_log;
mod repository;
mod response;
mod routes;
mod service;
mod state;

use std::net::SocketAddr;
use std::time::Duration;

use sqlx::postgres::PgPoolOptions;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let config = config::Config::from_env();
    let port = config.port;

    let pool = match PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
    {
        Ok(pool) => pool,
        Err(error) => {
            tracing::error!(error = %error, "failed to connect to PostgreSQL; check DATABASE_URL");
            std::process::exit(1);
        }
    };

    let state = state::AppState::new(pool, config);
    spawn_cleanup(state.clone());

    let app = routes::router(state);
    let listener = match tokio::net::TcpListener::bind(("0.0.0.0", port)).await {
        Ok(listener) => listener,
        Err(error) => {
            tracing::error!(error = %error, port, "failed to bind HTTP port");
            std::process::exit(1);
        }
    };

    tracing::info!("ORANGE rust-axum listening on http://0.0.0.0:{port}/api/v1");
    if let Err(error) = axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    {
        tracing::error!(error = %error, "HTTP server stopped");
    }
}

/// Removes expired operation logs and revocation markers once a day.
fn spawn_cleanup(state: state::AppState) {
    tokio::spawn(async move {
        loop {
            let retention = state.config.operation_log_retention_days;
            if let Err(error) =
                repository::operation_logs::delete_older_than_days(&state.pool, retention).await
            {
                tracing::error!(error = %error, "operation log cleanup failed");
            }
            if let Err(error) =
                sqlx::query("DELETE FROM sys_revoked_token WHERE expires_at < now()")
                    .execute(&state.pool)
                    .await
            {
                tracing::error!(error = %error, "revoked token cleanup failed");
            }
            tokio::time::sleep(Duration::from_secs(24 * 60 * 60)).await;
        }
    });
}
