import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/tableStyle.css';

const CheckboxGridDialog = ({ children, rows, columns, data, title, handleSave }) => {
    
    const [checkedState, setCheckedState] = useState({});

    useEffect(() => {
        const initialState = {};
        rows.forEach(row => {
            columns.forEach(column => {
                const cell = data[row.value]?.[column.value];
                if (cell !== undefined) {
                    initialState[`${row.value}-${column.value}`] = true;
                }
            });
        });
        setCheckedState(initialState);
    }, [data, rows, columns]);

    const handleCheckboxChange = async (event) => {
        const { dataset: { rowId, columnId }, checked } = event.target;
        let result = await handleSave(rowId, columnId, checked);
        if (result) {
            setCheckedState(prevState => ({
                ...prevState,
                [`${rowId}-${columnId}`]: checked,
            }));
        }
    };
    
    return (
        <>
            {children}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">{title}</th>
                            {columns.map(column => (
                                <th key={column.value} className="th">{column.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row.name}>
                                <td className="td">{row.label}</td>
                                {columns.map(column => {
                                    const isChecked = checkedState[`${row.value}-${column.value}`];
                                    return (
                                        <td key={column.value} className="td">
                                            <input
                                                type="checkbox"
                                                data-row-id={row.value}
                                                data-column-id={column.value}
                                                onChange={handleCheckboxChange}
                                                checked={!!isChecked}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

CheckboxGridDialog.propTypes = {
    children: PropTypes.node,
    rows: PropTypes.array,
    columns: PropTypes.array,
    data: PropTypes.any,
    title: PropTypes.string,
    handleSave: PropTypes.func
};

export default CheckboxGridDialog;