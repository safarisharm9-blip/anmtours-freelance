export default function ThankYouPage() {
  return (
    <main style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px', fontFamily:'system-ui'}}>
      <div style={{textAlign:'center',maxWidth:'600px'}}>
        <div style={{fontSize:'72px'}}>🎉</div>
        <h1 style={{fontSize:'38px',fontWeight:'800',margin:'16px 0'}}>Thank You for Booking with A&M Tours!</h1>
        <p style={{fontSize:'18px',color:'#333',marginTop:'10px'}}>Your boat trip booking in Sharm El Sheikh has been received successfully.</p>
        <p style={{fontSize:'18px',color:'#555'}}>Our team will contact you on WhatsApp within 10 minutes to confirm your trip.</p>
        <a href="/" style={{display:'inline-block',marginTop:'28px',background:'#0ea5e9',color:'white',padding:'14px 28px',borderRadius:'12px',textDecoration:'none',fontWeight:'bold'}}>Back to Home</a>
      </div>
    </main>
  )
