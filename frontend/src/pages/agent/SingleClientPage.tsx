import { useState, useEffect } from "react";

import ClientHeader from "../../components/agent/ClientHeader";
import Matches from "../../components/agent/Matches";
import Chat from "../../components/agent/Chat";
import History from "../../components/agent/History";
import NotificationPanel from "../../components/agent/NotificationPanel";
import SecondaryNavBar from "../../components/agent/SecondaryNavBar";


function SingleClientPage(){


const [activeTab,setActiveTab]=useState("matches");


const [notificationOpen,setNotificationOpen]=useState(false);
const [notifications,setNotifications]=useState([]);

const [notificationCount,setNotificationCount]=useState(0);

 const loadNotifications = async () => {

        const userId = 1; // temporary

        const notificationResponse =
            await getNotifications(userId);

        setNotifications(notificationResponse.data);

        const unreadResponse =
            await getUnreadNotificationCount(userId);

        setNotificationCount(unreadResponse.data);

    };
     useEffect(() => {

        loadNotifications();

    }, []);



return(

<div>


<ClientHeader
  
/>

<SecondaryNavBar
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  setNotificationOpen={setNotificationOpen}
/>

<div className="content">


{
activeTab==="matches" &&
<Matches/>
}



{
activeTab==="chat" &&
<Chat/>
}



{
activeTab==="history" &&
<History/>
}



</div>



{
notificationOpen &&

<NotificationPanel

close={()=>setNotificationOpen(false)}

/>

}


</div>

)


}


export default SingleClientPage;