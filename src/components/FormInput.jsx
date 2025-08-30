import React from "react";

/**
 * A reusable text input component with a floating label, icon support,
 * and a smooth, robust animation that works well with React's re-renders.
 *
 * @param {object} props - The standard input props (e.g., id, name, type, value, onChange)
 * @param {React.ReactNode} props.icon - The icon to display inside the input field.
 * @param {string} props.label - The text for the floating label.
 */
const FormInput = ({ icon, label, ...props }) => {
  return (
    <div className="relative">
      {/* The Input field */}
      <input
        {...props}
        // The `peer` class is essential for the label to track the input's state
        className="peer w-full pl-10 pr-3 py-2.5 bg-transparent border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition"
        // The placeholder must be a single space for the CSS to work correctly
        placeholder=" "
      />

      {/* The Floating Label */}
      <label
        htmlFor={props.id}
        className="absolute left-10 top-2.5 text-gray-400 text-base transition-all duration-300 pointer-events-none 
                   origin-[0] transform 
                   peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0
                   peer-focus:scale-75 peer-focus:-translate-y-5 peer-focus:text-red-600
                   peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:-translate-y-5"
      >
        {label}
      </label>

      {/* The Icon */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
        {icon}
      </div>

      {/* This small div creates the gap in the border where the label sits */}
      <div
        className="absolute left-8 top-0 h-[1px] bg-white transition-all duration-300 w-0 
                     peer-[:not(:placeholder-shown)]:w-auto peer-[:not(:placeholder-shown)]:px-2
                     peer-focus:w-auto peer-focus:px-2"
      ></div>
    </div>
  );
};

export default FormInput;
