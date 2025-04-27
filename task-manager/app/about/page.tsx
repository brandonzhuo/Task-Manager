import React from 'react'


interface User {
    id: number;
    name: string;
}

const aboutpage = async () => {
    
    const res = await fetch ('https://jsonplaceholder.typicode.com/users');
    const about: User[]  = await res.json();

    return (
        <>
            <h1>Userz</h1>
            <ul>
                {about.map(about => <li key={about.id}>{about.name} </li>)}
            </ul>
        </>
    )

 

}

export default aboutpage