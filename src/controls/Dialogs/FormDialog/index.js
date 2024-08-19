import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

const FormDialog = ({ title, children, handleSave, open, setOpen }) => {
    const { t } = useTranslation();
    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {children}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{t('generic.cancel')}</Button>
                <Button onClick={handleSave} autoFocus>{t('generic.save')}</Button>
            </DialogActions>
        </Dialog>
    );
};

FormDialog.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    handleSave: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
};

export default FormDialog;