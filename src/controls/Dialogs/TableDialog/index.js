import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './tableStyle.css';

const TableDialog = ({ data, columns }) => {
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

    const handleSave = () => {
        selectedRows.forEach((index) => {
            console.log(data[index]);
        });
    };

    return (
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
            <button onClick={handleSave}>Save</button>
        </div>
    );
};

TableDialog.propTypes = {
    data: PropTypes.array.isRequired,
    columns: PropTypes.arrayOf(PropTypes.shape({
        field: PropTypes.string.isRequired,
        headerName: PropTypes.string.isRequired,
    })).isRequired,
};

export default TableDialog;