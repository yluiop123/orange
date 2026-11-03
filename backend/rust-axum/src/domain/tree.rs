//! In-memory tree helpers for groups and permissions.
//!
//! Loading the whole tree once keeps the reference guards (ancestors for text
//! filters, enabled descendants before disabling, deepest-first delete) simple
//! and testable without a database.

use std::collections::{HashSet, VecDeque};

use crate::domain::entities::{Group, Permission};

pub trait TreeNode {
    fn node_id(&self) -> &str;
    fn node_parent_id(&self) -> Option<&str>;
}

impl TreeNode for Group {
    fn node_id(&self) -> &str {
        &self.id
    }

    fn node_parent_id(&self) -> Option<&str> {
        self.parent_id.as_deref()
    }
}

impl TreeNode for Permission {
    fn node_id(&self) -> &str {
        &self.id
    }

    fn node_parent_id(&self) -> Option<&str> {
        self.parent_id.as_deref()
    }
}

/// The root and every descendant, including roots that do not exist in the
/// index (callers validate existence first).
pub fn subtree_ids<T: TreeNode>(nodes: &[T], roots: &[String]) -> HashSet<String> {
    let mut visited: HashSet<String> = HashSet::new();
    let mut queue: VecDeque<String> = roots.iter().cloned().collect();
    while let Some(id) = queue.pop_front() {
        if !visited.insert(id.clone()) {
            continue;
        }
        for node in nodes {
            if node.node_parent_id() == Some(id.as_str()) {
                queue.push_back(node.node_id().to_string());
            }
        }
    }
    visited
}

/// Matched ids plus every ancestor, so a filtered tree keeps its shape.
pub fn with_ancestor_ids<T: TreeNode>(nodes: &[T], matched: &[String]) -> HashSet<String> {
    let mut ids: HashSet<String> = matched.iter().cloned().collect();
    for matched_id in matched {
        let mut current = matched_id.clone();
        let mut guard = 0usize;
        loop {
            guard += 1;
            if guard > nodes.len() + 2 {
                break;
            }
            let parent = nodes
                .iter()
                .find(|node| node.node_id() == current.as_str())
                .and_then(|node| node.node_parent_id())
                .map(str::to_string);
            match parent {
                Some(parent) if ids.insert(parent.clone()) => current = parent,
                _ => break,
            }
        }
    }
    ids
}

/// Checks descendants only, not the node itself.
pub fn has_enabled_descendant<T, F>(nodes: &[T], id: &str, enabled: F) -> bool
where
    T: TreeNode,
    F: Fn(&T) -> bool,
{
    let mut visited: HashSet<String> = HashSet::new();
    let mut queue: VecDeque<String> = VecDeque::new();
    for node in nodes {
        if node.node_parent_id() == Some(id) {
            queue.push_back(node.node_id().to_string());
        }
    }
    while let Some(current) = queue.pop_front() {
        if !visited.insert(current.clone()) {
            continue;
        }
        if let Some(node) = nodes.iter().find(|node| node.node_id() == current.as_str()) {
            if enabled(node) {
                return true;
            }
        }
        for node in nodes {
            if node.node_parent_id() == Some(current.as_str()) {
                queue.push_back(node.node_id().to_string());
            }
        }
    }
    false
}

pub fn depth_of<T: TreeNode>(nodes: &[T], id: &str) -> usize {
    let mut depth = 0usize;
    let mut current = id.to_string();
    let mut visited: HashSet<String> = HashSet::new();
    while visited.insert(current.clone()) {
        let parent = nodes
            .iter()
            .find(|node| node.node_id() == current.as_str())
            .and_then(|node| node.node_parent_id())
            .map(str::to_string);
        match parent {
            Some(parent) => {
                current = parent;
                depth += 1;
            }
            None => break,
        }
    }
    depth
}

/// Deepest nodes first, so deleting a parent and child together stays valid.
pub fn delete_order<T: TreeNode>(nodes: &[T], ids: &HashSet<String>) -> Vec<String> {
    let mut selected: Vec<&T> = nodes
        .iter()
        .filter(|node| ids.contains(node.node_id()))
        .collect();
    selected.sort_by(|left, right| {
        depth_of(nodes, right.node_id()).cmp(&depth_of(nodes, left.node_id()))
    });
    selected
        .into_iter()
        .map(|node| node.node_id().to_string())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Node {
        id: &'static str,
        parent: Option<&'static str>,
        enabled: bool,
    }

    impl TreeNode for Node {
        fn node_id(&self) -> &str {
            self.id
        }

        fn node_parent_id(&self) -> Option<&str> {
            self.parent
        }
    }

    fn sample() -> Vec<Node> {
        vec![
            Node { id: "00", parent: None, enabled: true },
            Node { id: "0001", parent: Some("00"), enabled: true },
            Node { id: "0002", parent: Some("00"), enabled: false },
            Node { id: "000101", parent: Some("0001"), enabled: true },
        ]
    }

    #[test]
    fn subtree_includes_the_root() {
        let nodes = sample();
        let ids = subtree_ids(&nodes, &["0001".to_string()]);
        assert!(ids.contains("0001"));
        assert!(ids.contains("000101"));
        assert!(!ids.contains("0002"));
    }

    #[test]
    fn ancestors_are_added_for_text_filters() {
        let nodes = sample();
        let ids = with_ancestor_ids(&nodes, &["000101".to_string()]);
        assert!(ids.contains("000101"));
        assert!(ids.contains("0001"));
        assert!(ids.contains("00"));
        assert!(!ids.contains("0002"));
    }

    #[test]
    fn enabled_descendants_only_checks_children() {
        let nodes = sample();
        assert!(has_enabled_descendant(&nodes, "00", |node| node.enabled));
        assert!(!has_enabled_descendant(&nodes, "0002", |node| node.enabled));
        assert!(!has_enabled_descendant(&nodes, "000101", |node| node.enabled));
    }

    #[test]
    fn delete_order_is_deepest_first() {
        let nodes = sample();
        let mut ids = HashSet::new();
        ids.insert("00".to_string());
        ids.insert("0001".to_string());
        ids.insert("000101".to_string());
        let order = delete_order(&nodes, &ids);
        assert_eq!(order, vec!["000101", "0001", "00"]);
    }
}
