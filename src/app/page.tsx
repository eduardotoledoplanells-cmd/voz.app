export const dynamic = 'force-dynamic';

const TRANSLATIONS = {
  es: {
    title: "Email verificado",
    message: "Tu cuenta ha sido activada con éxito.",
    submessage: "Vuelve a tu inicio de sesión",
    button: "en la App para continuar.",
    dev: "Desarrollado por"
  },
  en: {
    title: "Email verified",
    message: "Your account has been successfully activated.",
    submessage: "Go back to login",
    button: "in the App to continue.",
    dev: "Powered by"
  },
  pt: {
    title: "E-mail verificado",
    message: "Sua conta foi ativada com sucesso.",
    submessage: "Volte para o login",
    button: "no App para continuar.",
    dev: "Desenvolvido por"
  }
};

export default function Home({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = (searchParams.lang || 'es') as keyof typeof TRANSLATIONS;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.es;

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0a1a',
      color: 'white',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: '2rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '50%',
        height: '50%',
        background: 'radial-gradient(circle, rgba(142,45,226,0.15) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '50%',
        height: '50%',
        background: 'radial-gradient(circle, rgba(74,0,224,0.15) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 0
      }} />

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '3.5rem 2rem',
        borderRadius: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        maxWidth: '450px',
        width: '100%',
        zIndex: 1,
        animation: 'fadeIn 0.8s ease-out'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#4ade80',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          boxShadow: '0 0 30px rgba(74, 222, 128, 0.4)',
          transform: 'rotate(-5deg)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1 style={{ 
          fontSize: '2.25rem', 
          fontWeight: '900', 
          marginBottom: '1rem', 
          letterSpacing: '-0.02em',
          background: 'linear-gradient(to bottom, #ffffff 30%, #a5a5a5 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {t.title}
        </h1>
        
        <p style={{ 
          fontSize: '1.125rem', 
          color: 'rgba(255, 255, 255, 0.7)', 
          lineHeight: '1.6', 
          marginBottom: '3rem',
          fontWeight: '400'
        }}>
          {t.message}<br/>
          <span style={{ color: '#8E2DE2', fontWeight: '700' }}>{t.submessage}</span> {t.button}
        </p>

        <div style={{ 
          paddingTop: '2.5rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <p style={{ 
            fontSize: '0.7rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.2em', 
            color: 'rgba(255, 255, 255, 0.3)', 
            marginBottom: '1.25rem',
            fontWeight: '600'
          }}>
            {t.dev}
          </p>
          <img 
            src="/logo/logo-voz.png" 
            alt="Logo VOZ" 
            style={{ 
              height: '80px', 
              opacity: 0.95,
              filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.2))'
            }}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        body { background-color: #0a0a1a !important; }
      `}} />
    </main>
  );
}
