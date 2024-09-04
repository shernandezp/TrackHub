import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/tableStyle.css';

const CheckboxGridDialog = ({ children, resources, actions, data, handleSave }) => {
    
    const [checkedState, setCheckedState] = useState({});

    useEffect(() => {
        const initialState = {};
        resources.forEach(resource => {
            actions.forEach(action => {
                const resourceAction = data[resource.resourceId]?.[action.actionId];
                if (resourceAction !== undefined) {
                    initialState[`${resource.resourceId}-${action.actionId}`] = true;
                }
            });
        });
        setCheckedState(initialState);
    }, [data, resources, actions]);

    const handleCheckboxChange = async (event) => {
        const { dataset: { resourceId, actionId }, checked } = event.target;
        setCheckedState(prevState => ({
            ...prevState,
            [`${resourceId}-${actionId}`]: checked,
        }));
        await handleSave(resourceId, actionId, checked);
    };
    
    return (
        <>
            {children}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Resource</th>
                            {actions.map(action => (
                                <th key={action.actionId} className="th">{action.headerName}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {resources.map(resource => (
                            <tr key={resource.field}>
                                <td className="td">{resource.labelName}</td>
                                {actions.map(action => {
                                    const isChecked = checkedState[`${resource.resourceId}-${action.actionId}`];
                                    return (
                                        <td key={action.actionId} className="td">
                                            <input
                                                type="checkbox"
                                                data-resource-id={resource.resourceId}
                                                data-action-id={action.actionId}
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
    resources: PropTypes.array,
    actions: PropTypes.array,
    data: PropTypes.any,
    handleSave: PropTypes.func
};

export default CheckboxGridDialog;