/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

import { useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';

interface ConfirmDialogProps {
  title: ReactNode;
  message: ReactNode;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onConfirm: () => void | Promise<void>;
}

const ConfirmDialog = ({ title, message, open, setOpen, onConfirm }: ConfirmDialogProps) => {
  const { t } = useTranslation();
  const pending = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const confirm = async () => {
    if (pending.current) return;
    pending.current = true;
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      pending.current = false;
      setConfirming(false);
    }
  };
  const close = () => {
    if (!pending.current) setOpen(false);
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      data-testid="dialog-confirm"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={confirming} color="primary">
          {t('generic.cancel')}
        </Button>
        <Button onClick={confirm} disabled={confirming} color="primary" autoFocus>
          {t('generic.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
