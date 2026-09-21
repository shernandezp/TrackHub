import type { MouseEvent, ReactNode } from 'react';
import Icon from '@mui/material/Icon';
import Tooltip from '@mui/material/Tooltip';
import ArgonBox from 'components/ArgonBox';
import ArgonButton from 'components/ArgonButton';
import type { ArgonButtonProps } from 'components/ArgonButton';

export interface RowActionButtonProps {
  icon: string;
  label: string;
  color?: ArgonButtonProps['color'];
  disabled?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

/** One icon action in a table row: the label is the tooltip and the accessible name. */
function RowActionButton({ icon, label, color = 'dark', disabled = false, onClick }: RowActionButtonProps) {
  return (
    <Tooltip title={label}>
      <span>
        <ArgonButton
          variant="text"
          color={color}
          size="small"
          iconOnly
          aria-label={label}
          disabled={disabled}
          onClick={(event) => {
            // A row's own click toggles its selection; an icon tap must not undo what it just did.
            event.stopPropagation();
            onClick(event);
          }}
        >
          <Icon>{icon}</Icon>
        </ArgonButton>
      </span>
    </Tooltip>
  );
}

export function RowActions({ children }: { children: ReactNode }) {
  return (
    <ArgonBox display="flex" justifyContent="center" alignItems="center" gap={0.25}>
      {children}
    </ArgonBox>
  );
}

export default RowActionButton;
