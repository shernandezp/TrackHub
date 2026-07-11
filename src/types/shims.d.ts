/**
 * Module declarations for dependencies that ship no types and have no
 * published @types package. Revisit each when its usage is converted
 * (migration spec 26); delete a shim if upstream gains types.
 */

declare module 'leaflet-fullscreen' {
  // Side-effect plugin: augments L.Map with fullscreen control options.
  // Typed minimally; consumers interact with it through the leaflet API.
  const plugin: unknown;
  export default plugin;
}

declare module '@pathofdev/react-tag-input' {
  import * as React from 'react';

  export interface ReactTagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    maxTags?: number;
    editable?: boolean;
    readOnly?: boolean;
    removeOnBackspace?: boolean;
    validator?: (value: string) => boolean;
  }

  const ReactTagInput: React.FC<ReactTagInputProps>;
  export default ReactTagInput;
}

declare module 'react-github-btn' {
  import * as React from 'react';

  export interface GitHubButtonProps {
    href: string;
    'data-icon'?: string;
    'data-size'?: string;
    'data-show-count'?: boolean | string;
    'aria-label'?: string;
    children?: React.ReactNode;
  }

  const GitHubButton: React.FC<GitHubButtonProps>;
  export default GitHubButton;
}
