use deviceforge_plugin_runtime::serve_once_with_context;

#[tokio::main]
async fn main() -> Result<(), String> {
    serve_once_with_context(deviceforge_protocol4_echo::echo).await
}
