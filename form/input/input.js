import React, {useState, useContext} from 'react';
import PropTypes from 'prop-types';

import './input.scss';

const SmartInput = props => {
    const Value = useContext('focused');
    console.log(Value);
    const { addChild, removeChild, ...inputProps } = props;
    let {className, labelText, labelStyle, error, value, inputStyle, onBlur, onChange, argsForHandlers, ...restProps} = inputProps;
    if (inputProps.type === 'reset') {
        labelStyle = 'reset-input';
        inputStyle = '';
    }
    if (props.type === 'radio' || props.type === 'checkbox') {
        inputStyle = 'check-input';
        labelStyle = labelStyle === 'like-placeholder' ? 'in-row' : labelStyle;
    }
    const ClassName = `
                smart-input
                ${className}
                ${labelStyle} 
                ${inputStyle}
                ${error ? " invalid-input" : ""}
            `;
    return (
        <label className={ClassName.replace(/\s{2,}/g, " ")}>
            {labelStyle === 'in-row'
                ? <React.Fragment>
                        <div className="smart-input__error-wrapper">
                            <props.tag
                                className={`smart-input__input${error ? " invalid-input" : ""}${value ? " dirty-input" : ""}`}
                                {...restProps}
                                value={value}
                                onChange={e => onChange(e, ...argsForHandlers)}
                                onBlur={e => onBlur(e, ...argsForHandlers)}
                            >
                                {
                                    props.fieldoptions
                                    && props.fieldoptions.map((option, i) => <option key={`${option.value}${i}`} value={option.value}>{option.text}</option>)
                                }
                            </props.tag>
                            {error && <div className="input-error-msg">{error.msg}</div>}
                        </div>
                        <div className={`smart-input__label${error ? " invalid-input" : ""}${value ? " dirty-input" : ""}`}>{labelText}</div>
                  </React.Fragment>
                : <React.Fragment>
                    <props.tag
                        className={`smart-input__input${error ? " invalid-input" : ""}`}
                        {...restProps}
                        value={value}
                        onChange={e => onChange(e, ...argsForHandlers)}
                        onBlur={e => onBlur(e, ...argsForHandlers)}
                    >
                        {
                            props.fieldoptions
                            && props.fieldoptions.map((option, i) => <option key={`${option.value}${i}`} value={option.value}>{option.text}</option>)
                        }
                    </props.tag>
                    <div className={`smart-input__label${error ? " invalid-input" : ""}${value ? " dirty-input" : ""}`}  >{labelText}</div>
                    {error && <div className='input-error-msg'>{error.msg}</div>}
                  </React.Fragment>
            }
        </label>
    )
};

export default SmartInput;

const errorPropsValidation = function(props, error) {
    if (! typeof props[error] === 'object')
        return new Error(
            `Invalid prop ${error} supplied to Input. Validation failed.`
        );
};

SmartInput.propTypes = {
    tag: PropTypes.string,
    fieldoptions: function(props, fieldoptions) {
        if ((props[fieldoptions] && !Array.isArray(props[fieldoptions]))
            || (Array.isArray(props[fieldoptions]) && (typeof props[fieldoptions][0].text !== 'string' || typeof props[fieldoptions][0].value !== 'string')))
            return new Error(
                `Invalid prop ${fieldoptions} supplied to Input. Fieldoptions must be array of objects with 'value' and 'text' properties.`
            );
    },
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    labelText: PropTypes.string,
    labelStyle: PropTypes.oneOf(['in-row', 'in-col', 'like-placeholder', 'reset-input']),
    inputStyle: PropTypes.oneOf(['shadowed', 'outlined', 'underlined', 'check-input']),
    onBlur: PropTypes.func.isRequired,
    argsForHandlers: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.PropTypes.any.isRequired,
    error: function(props, error) {
        if (typeof props[error] !== 'undefined' && (typeof props[error] !== 'object' || props[error] && !props[error].msg))
            return new Error(
                `Invalid prop ${error} supplied to Input. Error must be object with 'msg' property or null.`
            );
    },
    className: PropTypes.string,
};

SmartInput.defaultProps = {
    labelText: '',
    className: '',
    labelStyle: 'in-row',
    inputStyle: 'outlined',
    tag: 'input',
    fieldoptions: null,
};
