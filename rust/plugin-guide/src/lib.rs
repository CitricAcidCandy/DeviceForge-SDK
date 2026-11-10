//! 公开插件开发知识的编译期正文；不读取运行时路径、环境变量或网络。

/// 知识版本独立于浏览器SDK、任务协议和离线包格式。
pub const GUIDE_VERSION: u32 = 5;

/// 浏览器插件的八个公开主题。
pub mod frontend {
    pub const OVERVIEW: &str = include_str!("../../../docs/frontend/overview.md");
    pub const MANIFEST: &str = include_str!("../../../docs/frontend/manifest.md");
    pub const SDK: &str = concat!(
        include_str!("../../../docs/frontend/sdk.md"),
        "\n\n",
        include_str!("../../../docs/frontend/composition.md")
    );
    pub const LIFECYCLE: &str = include_str!("../../../docs/frontend/lifecycle.md");
    pub const EXAMPLES: &str = include_str!("../../../docs/frontend/examples.md");
    pub const PACKAGING: &str = include_str!("../../../docs/frontend/packaging.md");
    pub const DEPENDENCIES: &str = include_str!("../../../docs/frontend/dependencies.md");
    pub const VALIDATION: &str = include_str!("../../../docs/frontend/validation.md");
}

/// 服务器插件的八个公开主题。
pub mod backend {
    pub const OVERVIEW: &str = include_str!("../../../docs/backend/overview.md");
    pub const MANIFEST: &str = include_str!("../../../docs/backend/manifest.md");
    pub const SDK: &str = include_str!("../../../docs/backend/sdk.md");
    pub const LIFECYCLE: &str = include_str!("../../../docs/backend/lifecycle.md");
    pub const EXAMPLES: &str = include_str!("../../../docs/backend/examples.md");
    pub const PACKAGING: &str = include_str!("../../../docs/backend/packaging.md");
    pub const DEPENDENCIES: &str = include_str!("../../../docs/backend/dependencies.md");
    pub const VALIDATION: &str = include_str!("../../../docs/backend/validation.md");
}

#[cfg(test)]
mod tests {
    use super::{backend, frontend};

    #[test]
    fn all_topics_are_self_contained_and_within_budget() {
        for content in [
            frontend::OVERVIEW,
            frontend::MANIFEST,
            frontend::SDK,
            frontend::LIFECYCLE,
            frontend::EXAMPLES,
            frontend::PACKAGING,
            frontend::DEPENDENCIES,
            frontend::VALIDATION,
            backend::OVERVIEW,
            backend::MANIFEST,
            backend::SDK,
            backend::LIFECYCLE,
            backend::EXAMPLES,
            backend::PACKAGING,
            backend::DEPENDENCIES,
            backend::VALIDATION,
        ] {
            assert!(content.starts_with('#'));
            assert!((100..=131_072).contains(&content.len()));
            assert!(!content.contains('\u{feff}'));
        }
        assert!(frontend::SDK.contains("whenAvailable"));
        assert!(frontend::SDK.contains("PointAccess"));
        assert!(frontend::SDK.contains("UiAccess"));
        assert!(backend::SDK.contains("serve_once_with_context"));
    }
}
