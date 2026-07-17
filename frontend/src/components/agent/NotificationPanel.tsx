import React from "react";


function NotificationPanel({close}){


return(

<div className="notification-panel">


<div className="notification-header">

Notifications

<button onClick={close}>
X
</button>

</div>



<div className="notification">

❤️ New Interest

<br/>

Arjun interested

</div>



<div className="notification">

💬 New Message

<br/>

Karthik sent message

</div>




<div className="notification">

👁 Profile Viewed

<br/>

Rahul viewed profile

</div>



</div>

)

}


export default NotificationPanel;