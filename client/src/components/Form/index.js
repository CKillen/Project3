import React from 'react';
import './form.css';

export const Form = ({ onSubmit, formBtntext, loginSignupState }) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group usernameTitle">
        <label htmlFor="name">Username (between 3 - 10 characters)</label>
        <input 
          className="form-control usernameBox" 
          id="name" 
          pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{3,10}$"
        />
      </div>
      <div className="form-group passwordTitle">
        <label htmlFor="password">Password (between 6 - 24)</label>
        <input
          type="password"
          className="form-control passwordBox"
          id="password"
          placeholder=""
          pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{6,24}$"
        />
      </div>
      <div className="form-group">
        <button className="form-control btn btn-danger submit-btn" type="submit">
          {formBtntext}
        </button>
      </div>
      <div className="loginSignupSwitch">
        <a onClick={loginSignupState}>{formBtntext === "Login" ? "Click here to Signup" : "Click here to Login"}</a>
      </div>
    </form>
  );
};
export default Form;