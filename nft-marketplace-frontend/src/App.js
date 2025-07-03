import ConnectWalletButton from "./components/ConnectWalletButton"
import NFTGallery from "./components/NFTGallery"
import PublishNFT from "./components/PublishNFT"

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#333",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          padding: "30px 40px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 20px 0",
            textAlign: "center",
          }}
        >
          🎨 Mi Marketplace de NFTs
        </h1>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ConnectWalletButton />
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        {/* Welcome Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "40px",
            marginBottom: "40px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "600",
              color: "#2d3748",
              marginBottom: "15px",
            }}
          >
            🚀 Bienvenido a tu Marketplace
          </h2>
        </div>

        {/* NFT Gallery Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "40px",
            marginBottom: "40px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#2d3748",
              marginBottom: "25px",
              textAlign: "center",
            }}
          >
            Galería de NFTs
          </h3>
          <NFTGallery />
        </div>

        {/* Publish NFT Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "40px",
            marginBottom: "40px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              color: "#2d3748",
              marginBottom: "25px",
              textAlign: "center",
            }}
          >
            ✨ Publicar Nuevo NFT
          </h3>
          <PublishNFT />
        </div>
      </div>
    </div>
  )
}

export default App
