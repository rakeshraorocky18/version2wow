import { useState } from "react";

import ClientHeader from "../../components/agent/ClientHeader";
import Matches from "../../components/agent/Matches";
import Chat from "../../components/agent/Chat";
import History from "../../components/agent/History";
import NotificationPanel from "../../components/agent/NotificationPanel";
import SecondaryNavBar from "../../components/agent/SecondaryNavBar";


function SingleClientPage(){


const [activeTab,setActiveTab]=useState("matches");
const [notificationOpen,setNotificationOpen]=useState(false);

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