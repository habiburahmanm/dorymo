/**
 * DOM Mutation Protection for React 19 Virtual DOM Reconciler.
 *
 * Why this exists:
 * In multilingual web applications (especially with Bengali/English mixed content),
 * browser translation features (like Google Chrome's built-in Google Translate,
 * Edge Translate) and browser extensions (Grammarly, DarkReader, Lingvanex)
 * manipulate real DOM text nodes directly by wrapping or replacing them with <font> tags.
 *
 * When React triggers a subsequent re-render or state update, React's reconciler executes:
 *   parentNode.insertBefore(newNode, referenceNode)
 * or:
 *   parentNode.removeChild(childNode)
 *
 * Because Google Translate or an extension re-parented or wrapped referenceNode/childNode,
 * `referenceNode.parentNode !== parentNode`, causing the browser to throw an uncaught DOMException:
 *   "NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
 *
 * This patch intercepts `insertBefore` and `removeChild` on `Node.prototype` to gracefully resolve
 * intermediate wrapper elements (like <font>) or safely append/remove, completely preventing the crash.
 */
export function initDomPatcher() {
  if (typeof window === 'undefined' || typeof Node !== 'function' || !Node.prototype) {
    return;
  }

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      // 1. If referenceNode was wrapped (e.g. by Google Translate <font> tag),
      // look for the direct child ancestor that is still attached to `this`.
      let directChild: Node | null = referenceNode;
      while (directChild && directChild.parentNode && directChild.parentNode !== this) {
        directChild = directChild.parentNode;
      }

      if (directChild && directChild.parentNode === this) {
        return originalInsertBefore.call(this, newNode, directChild) as T;
      }

      // 2. If referenceNode is completely detached or not inside `this`, fall back to appendChild
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      // If child was moved or wrapped by an extension, remove from its actual parent if still present
      if (child.parentNode) {
        return child.parentNode.removeChild(child) as T;
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };
}
