import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Checkbox } from '@mui/material';
import 'controls/Dialogs/styles/tableStyile.css';

const StaticTableDialog = ({ 
        title, 
        children, 
        handleSave, 
        open, 
        setOpen,
        checkLabel='',
        data, 
        columns 
    }) => {
    const { t } = useTranslation();
    const handleClose = () => {
        setOpen(false);
    };

    const [selectedRows, setSelectedRows] = useState([]);
    const [checked, setChecked] = useState(false);

    const handleRowSelection = (index) => {
        const alreadySelected = selectedRows.includes(index);
        const newSelectedRows = alreadySelected
            ? selectedRows.filter((i) => i !== index)
            : [...selectedRows, index];
        setSelectedRows(newSelectedRows);
    };

    const handleSelectAll = () => {
        if (selectedRows.length < data.length) {
            setSelectedRows(data.map((_, index) => index));
        } else {
            setSelectedRows([]);
        }
    };

    const onSave = async () => {
        await handleSave(selectedRows, checked);
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{title}</DialogTitle>
                <DialogContent>
                    {children}
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="th"><input type="checkbox" onChange={handleSelectAll} checked={selectedRows.length === data.length} /></th>
                                    {columns.map((column) => <th key={column.field} className="th">{column.headerName}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, index) => (
                                    <tr key={index}>
                                        <td className="td"><input type="checkbox" checked={selectedRows.includes(index)} onChange={() => handleRowSelection(index)} /></td>
                                        {columns.map((column) => <td key={column.field} className="td">{row[column.field]}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            <DialogActions>
                <Box display="flex" justifyContent="space-between" width="90%">
                    {checkLabel && (
                        <FormControlLabel
                            control={
                                <Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} />
                            }
                            label={checkLabel}
                        />
                    )}
                    <Box flexGrow={1} display="flex" justifyContent="flex-end">
                        <Button onClick={handleClose}>{t('generic.cancel')}</Button>
                        <Button onClick={onSave} autoFocus>{t('generic.save')}</Button>
                    </Box>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

StaticTableDialog.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    handleSave: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    checkLabel: PropTypes.string,
    data: PropTypes.array.isRequired,
    columns: PropTypes.array.isRequired
};

export default StaticTableDialog;