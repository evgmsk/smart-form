/**
 * project new-wiz-bat
 */

import React from'react';
import PropTypes from 'prop-types';

import Input from './input/input';

import './form.scss';

class SmartForm extends React.Component {

    static findInput(node) {
        if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT')
            return node;
        else if (node.length > 1) {
            let i = 0;
            while (i < node.length)  {
                const input = SmartForm.findInput(node[i]);
                if (input)
                    return input
            }
        } else if (node.children)
            return SmartForm.findInput(node.children);
    }

    static resetErrors(values) {
        const errors = {};
        for (let prop in  values) {
            if (values.hasOwnProperty(prop)) {
                if (!Array.isArray(values[prop])) {
                    errors[prop] = null;
                } else {
                    errors[prop] = [];
                    //console.log(prop, values[prop]);
                    values[prop].forEach((value, i) => {
                        Object.keys(value).forEach(key => {
                            errors[prop][i] = errors[prop][i] ? errors[prop][i] : {};
                            errors[prop][i][key] = null;
                        })
                    });
                }
            }
        }
        return errors;
    }

    constructor(props) {
        super(props);
        this.initialValues = {...props.values};
        this.state = {
            resStatus: null,
            resMessage: '',
            values: props.values,
            errors: props.errors || SmartForm.resetErrors(props.values),
            successfullySubmitted: false,
            isValidating: false,
        };
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this);
        this.handleOnBlur = this.handleOnBlur.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.addChild = this.addChild.bind(this);
        this.removeChild = this.removeChild.bind(this);
        this.handleOnEnter = this.handleOnEnter.bind(this);
        this.refToForm = React.createRef();
    }

    shouldComponentUpdate(props, newState) {
        const compare = (newState, oldState) => {
            for (let key in newState) {
                if (newState.hasOwnProperty(key)) {
                    if(typeof oldState[key] === 'object' && oldState[key] !== null)
                        return compare(oldState[key], newState[key]);
                    else {
                        if (oldState[key] !== newState[key]) {
                            return true
                        }
                    }
                }
            }
            return false;
        };
        return !((newState.isValidating !== this.state.isValidating) && !compare(newState.errors, this.state.errors));
    }

    addChild(e, name, child) {
        e.preventDefault();
        e.stopPropagation();
        this.setState(state => {
            const { values, errors } = state;
            const error = {...child};
            Object.keys(error).forEach(key => {
                error[key] = null;
            });
            const newValues = {...values, [name]:[...values[name], child]};
            const newErrors = {...errors, [name]:[...errors[name], error]};
            return { values: newValues, errors: newErrors }
        });
    };

    removeChild(e, name, index) {
        e.preventDefault();
        e.stopPropagation();
        this.setState(state => {
            const {values, errors} = state;
            const newValues = {...values, [name]: values[name].filter((item, i) => i.toString() !== index.toString())};
            const newErrors = {...errors, [name]: errors[name].filter((item, i) => i.toString() !== index.toString())};
            if (values[name].length > 1)
                return { values: newValues, errors: newErrors }
        });
    };

    handleReset() {
        this.setState( {values: this.initialValues, errors: SmartForm.resetErrors(this.initialValues)})
    }

    handleOnEnter(e) {
        if (this.state.isValidating)
            return;
        const target = e.target;
        if (e.key === 'Enter' && target.type === 'submit') {
            this.handleSubmit(e);
        } else if (e.key === 'Enter' && target.tagName !== 'BUTTON'){
            e.stopPropagation();
        } else if (e.key === 'Tab' && target.type === 'submit') {
            const formChildren = this.refToForm.current.children;
            const input = SmartForm.findInput(formChildren);
            if (input) {
                e.preventDefault();
                input.focus();
            }
        }
    }

    handleOnClick(e) {
        if (this.state.isValidating)
            return;
        const target = e.target;
        if (target.type === 'reset' && (target.tagName === 'INPUT' || target.tagName === 'BUTTON')) {
            this.handleReset()
        }
    }

    handleOnChange(e, name, index) {
        if (this.state.isValidating)
            return;
        const target = e.target;
        const  error = this.state.errors[name];
        const isArray = Array.isArray(error);
        if (error && !isArray || isArray && error[index])
            this.handleOnBlur(e, name, index);
        this.setState(state => {
            const { values } = state;
            if (!(name in values))
                throw Error(`Form 'values' and input name: ${target.name} do not match or do not set appropriately`);
            if(target.type === 'checkbox') {
                const newValue = values[name] ? "" : target.value;
                return {values: {...values, [name]: newValue}};
            }
            if (!Array.isArray(values[name]))
                return {values: {...values, [name]: target.value}};
            else {
                const newValues = state.values[name].filter(x => 1);
                newValues[index] = {...state.values[name][index], [target.name]: target.value};
                return {values: {...values, [name]: newValues}}
            }
        })
    }

    handleOnBlur(e, name, index) {
        if (this.state.isValidating)
            return;
        const target = e.target;
        const { validationschema } = this.props;
        if (!validationschema[target.name].required)
            return;
        const error = validationschema[target.name].validator(target.value);
        this.setState(state => {
            const errors = {...state.errors};
            if (!(name in errors))
                throw new Error(`Form 'values' and input name: ${target.name} do not match or do not set appropriately`);
            if (!Array.isArray(errors[name]))
                return { errors: {...errors, [name]: error}};
            else {
                const newErrors = errors[name].filter(x => 1);
                newErrors[index] = newErrors[index] || {};
                newErrors[index][target.name] = error;
                return { errors: {...errors, [name]: newErrors}}
            }
        })
    }

    validateField(key, value, errors) {
        const {validationschema} = this.props;
        if (validationschema[key].required) {
            const error = validationschema[key].validator(value);
            if (error) {
                errors[key] = error;
                return true;
            } else {
                errors[key] = null;
            }
        } else {
            errors[key] = null;
        }
        return false;
    }

    validateArrayOfFields(key, value, errors) {
        let invalid = false;
        const {validationschema} = this.props;
        value.forEach((v, i) => {
            const names = Object.keys(v);
            names.forEach(name => {
                const valueToCheck = v[names[i]].trim();
                value[i][name] = valueToCheck;
                if (validationschema[name].required) {
                    const error = validationschema[name].validator(valueToCheck);
                    if (error) {
                        invalid = true;
                        errors[key][i] = errors[key][i] || {};
                        errors[key][i][name] = error;
                    } else {
                        errors[key][i] = errors[key][i] || {};
                        errors[key][i][name] = null;
                    }
                } else {
                    errors[key][i] = errors[key][i] || {};
                    errors[key][i][name] = null;
                }
            });
        });
        return invalid;
    }

    validateForm() {
        let invalidForm = false;
        const values = {};
        const errors = {};
        this.setState(state => {
            for (let key in state.values) {
                if (state.values.hasOwnProperty(key)) {
                    const value = state.values[key];
                    if (Array.isArray(value)) {
                        errors[key] = [];
                        values[key] = [...value];
                        invalidForm = this.validateArrayOfFields(key, values[key], errors)
                    } else {
                        const valueToCheck = value.trim();
                        values[key] = valueToCheck;
                        invalidForm = this.validateField(key, valueToCheck, errors)
                    }
                }
            }
            return {errors, values, isValidating: false}
        });
        return {invalidForm, values};
    }

    validateAndFetch() {
        const validationResult = this.validateForm();
        const values = {...validationResult.values};
        console.log(Date.now());
        if (validationResult.invalidForm)
            return;
        this.props.submit.fetch().then(res => {
            if (res.status < 300) {
                this.setState(state => {
                    return {...state, successfullySubmitted: true}
                }, this.props.submit.onSuccessSubmit)
            }
            if (res.status === 422 && res.errors) {
                this.setState(state => {
                    const errors = {...state.errors};
                    for (let key in res.errors) {
                        if (res.errors.hasOwnProperty(key) && key in errors) {
                            const error = res.errors[key];
                            if ('msg' in error || (Array.isArray(error) && 'msg' in error[0]))
                                errors[key] = error;
                        }
                    }
                    return errors
                })
            } else {

            }
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        console.log(Date.now());
        const {successfullySubmitted, isValidating} = this.state;
        if (successfullySubmitted || isValidating) {
            return;
        }
        this.setState({isValidating:true}, this.validateAndFetch);
    }

    render() {
        const { errors, values } = this.state;
        const propsForChildren = {
            values,
            errors,
            addChild: this.addChild,
            removeChild: this.removeChild,
            onClick: this.handleOnClick,
            onBlur: this.handleOnBlur,
            onChange: this.handleOnChange,
        };
        const {children, ...restProps} = this.props;
        console.log(this.state);
        return (
            <React.Fragment>
                {this.state.successfullySubmitted && <div className="on-success-submit">Success!</div>}
                <form
                    onSubmit={this.props.onSubmit || this.handleSubmit}
                    onKeyDown={this.props.onKeyDown || this.handleOnEnter}
                    className={this.props.className}
                    name="smart-form"
                    ref={this.refToForm}
                    {...restProps}
                >
                    {children(propsForChildren)}
                </form>
            </React.Fragment>
            );
    }
}

export default SmartForm;

SmartForm.propTypes = {
    onSubmit: PropTypes.func,
    onKeyDown: PropTypes.func,
    submit: function(props, submit) {
        const Submit = props[submit];
        if (typeof Submit !== 'undefined' && typeof Submit !== 'object') {
            return new Error(
                `Invalid prop ${submit} supplied to Input. Submit must be object.`
            );
        } else if (typeof Submit === 'object' && (typeof Submit.fetch !== 'function' || typeof Submit.onSuccessSubmit !== 'function')) {
            return new Error(
                `Invalid prop ${submit} supplied to Input. Submit must have two properties: 'fetch' and 'onSuccessSubmit'. Both must be function`
            );
        }
    },
    validationschema: function(props, validationschema) {
        if (typeof props[validationschema] !== 'object') {
            return new Error(
                `Invalid prop ${validationschema} supplied to Input. Validationschema is required and must be object.`
            );
        } else if (props[validationschema].required && !props[validationschema].validator)
            return new Error(
                `Invalid prop ${validationschema} supplied to Input. Validationschema must have 'required' property and must have 'validator' property if 'required' is true.`
            );
    },
    values: PropTypes.object.isRequired,
    className: PropTypes.string.isRequired,
};

export const SmartInput = Input;
