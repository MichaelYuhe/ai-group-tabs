import { InputHTMLAttributes } from "react";

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm 
      ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 
      focus:ring-inset sm:text-sm sm:leading-6"
      {...props}
    />
  );
}
