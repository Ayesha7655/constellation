// Local ESLint rule: flag interactive HOST elements that lack a `data-testid`.
//
// Scope is deliberately host elements only (`button`, `input`, `select`,
// `textarea`, and `<a onClick>`). Custom components (e.g. <Button>) are covered
// structurally — the shared primitive carries the `testId` prop — so they are
// not flagged here. An element that spreads props ({...rest}) is skipped, since
// the test id may arrive that way. Severity is `warn` during rollout; flip to
// `error` once coverage lands (see the test-id coverage plan).

const INTERACTIVE = new Set(['button', 'input', 'select', 'textarea']);

function hasAttr(node, attrName) {
  return node.attributes.some(
    (attr) =>
      attr.type === 'JSXAttribute' &&
      attr.name?.type === 'JSXIdentifier' &&
      attr.name.name === attrName,
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export const requireTestId = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Require data-testid on interactive host elements.' },
    messages: {
      missing:
        "Interactive <{{name}}> is missing a data-testid. Add one (or use a shared primitive's testId prop) so tests can locate it.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name?.type !== 'JSXIdentifier') {
          return;
        }
        const name = node.name.name;
        const interactive = INTERACTIVE.has(name) || (name === 'a' && hasAttr(node, 'onClick'));
        if (!interactive) {
          return;
        }
        const hasSpread = node.attributes.some((attr) => attr.type === 'JSXSpreadAttribute');
        if (hasSpread || hasAttr(node, 'data-testid')) {
          return;
        }
        context.report({ node, messageId: 'missing', data: { name } });
      },
    };
  },
};
