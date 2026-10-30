import { Link } from "react-router-dom";
import { SignInButton ,SignUpButton} from '@clerk/react';

function Navbar() {
  return (
    <div>
      <nav className="flex border border-white ">
        <div className="left">
          <Link to="/">Logo</Link>
        </div>

        <div className="right">
          <Link to="/">Home</Link>

          <Link to="/about">About</Link>

          <Link 
                to="/login"
                className="" 
                > 
                <SignUpButton />
            </Link>

          <Link to="/signup"> <SignInButton /></Link>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;