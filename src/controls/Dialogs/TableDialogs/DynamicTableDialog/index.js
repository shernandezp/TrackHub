import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import 'controls/Dialogs/styles/tableStyle.css';

const DynamicTableDialog = ({ 
        title, 
        children, 
        handleAdd,
        handleDelete,
        handleClose,
        open,
        data, 
        columns 
    }) => {
    const { t } = useTranslation();

    const [selectedRows, setSelectedRows] = useState([]);

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
        await handleAdd();
    };

    const onDelete = async () => {
        await handleDelete(selectedRows);
    };

    const onClose = async () => {
        await handleClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
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
                <Button onClick={onClose}>{t('generic.close')}</Button>
                <Button onClick={onDelete}>{t('generic.delete')}</Button>
                <Button onClick={onSave} autoFocus>{t('generic.add')}</Button>
            </DialogActions>
        </Dialog>
    );
};

DynamicTableDialog.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    handleAdd: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,
    handleClose: PropTypes.func,
    open: PropTypes.bool.isRequired,
    data: PropTypes.array.isRequired,
    columns: PropTypes.array.isRequired
};

export default DynamicTableDialog;