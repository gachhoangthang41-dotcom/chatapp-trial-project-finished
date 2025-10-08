import{ IconType }from 'react-icons';
'use client'
interface AuthSocialButtonProps{
    icon:IconType;
    onClick:()=> void;
    label:string;
}
const AuthSocialButton:React.FC<AuthSocialButtonProps>=({
    icon:Icon,
    onClick,
    label
})=>{

    return(
 <button
      type="button"
      onClick={onClick}
      className="
        inline-flex
        w-full
        justify-center
        items-center
        rounded-md
        bg-white
        px-4
        py-2
        text-gray-500
        shadow-sm
        ring-1
        ring-inset
        ring-gray-300
        hover:bg-gray-100
      "
    >
      <Icon className="h-5 w-5" />
       <span className="ml-2">{label}</span>
    </button>
  );
};
export default AuthSocialButton;