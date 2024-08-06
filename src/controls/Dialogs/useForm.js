import { useState } from 'react';

function useForm(initialValues) {
    const [values, setValues] = useState(initialValues);
  
    const handleChange = (event) => {
      setValues({
        ...values,
        [event.target.name]: event.target.value,
      });
    };
  
    return [values, handleChange, setValues];
  }

export default useForm;