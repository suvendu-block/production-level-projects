import {
    Show,
    SignInButton,
    SignUpButton,
    UserButton
} from "@clerk/react";

function App() {
    return (
        <div >
            <Show when="signed-out">
                <div className="">
                     <SignInButton />                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
                     <SignUpButton />
                </div>
               
            </Show>

            <Show when="signed-in">
                <UserButton />
                <h1>Welcome!</h1>
            </Show>
        </div>
    );
}

export default App;