/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

const FormDialog = ({ 
        title, 
        children, 
        handleSave, 
        open, 
        setOpen,
        handleCancel = () => {},
    }) => {
    const { t } = useTranslation();
    const handleClose = () => {
        handleCancel();
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
    handleCancel: PropTypes.func,
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
};

export default FormDialog;