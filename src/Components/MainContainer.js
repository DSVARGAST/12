import React, { useState, useEffect } from "react";
import "./MainContainer.css";
import Banner from "../img/1.jpg";
import CardMain from "./CardMain";
// Elimina las importaciones de imágenes estáticas (Card1, Card2, etc.) ya no las usarás
// import Card1 from "../img/card1.jpg";
// import Card2 from "../img/card2.jpg";
// import Card3 from "../img/card3.jpg";
// import Card4 from "../img/card4.jpg";
// import Card5 from "../img/card5.jpg";
// import Card6 from "../img/card6.jpg";
import MainRightTopCard from "./MainRightTopCard";
import MainRightBottomCard from "./MainRightBottomCard";

function MainContainer() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect para cargar las publicaciones cuando el componente se monte
  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API}/publications`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPublications(data); // Almacena los datos en el estado 'publications'
      } catch (err) {
        console.error("Error al cargar publicaciones:", err); // Imprime el error completo para depuración
        setError(err.message); // Captura el mensaje de error
      } finally {
        setLoading(false); // La carga ha terminado (con o sin error)
      }
    };

    fetchPublications(); // Ejecuta la función de carga
  }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

  // Muestra un estado de carga mientras se obtienen los datos
  if (loading) {
    return (
      <div className="maincontainer">
        <div className="left">
          <div className="cards">
            <p>Cargando publicaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  // Muestra un mensaje de error si la carga falló
  if (error) {
    return (
      <div className="maincontainer">
        <div className="left">
          <div className="cards">
            <p style={{ color: 'red' }}>Error al cargar publicaciones: {error}</p>
            <p>Por favor, asegúrate de que tu servidor backend (`node server.js`) esté corriendo y accesible en `http://localhost:5000`.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="maincontainer">
      <div className="left">
        {/* Sección del Banner (sin cambios) */}
        <div
          className="banner"
          style={{
            background: `url(${Banner})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="textContainer">
            <h1>Round Hall</h1>
            <h2>1.5 ETH</h2>
            <p>Uploaded by Alexander Vernof</p>
            <div className="bid">
              <a href="#" className="button">
                Bid Now
              </a>
              <p>
                Ending In <span>2d:15h:20m</span>
              </p>
            </div>
          </div>
        </div>

        <div className="cards">
          {/* Sección de filtros (sin cambios) */}
          <div className="filters">
            <div className="popular">
              <h2>Feed</h2>
              <a href="#" className="button2">
                Popular
              </a>
            </div>
            <div className="filter_buttons">
              <a href="#" className="button">
                All
              </a>
              <a href="#" className="button2">
                Illustration
              </a>
              <a href="#" className="button2">
                Art
              </a>
              <a href="#" className="button2">
                Games
              </a>
            </div>
          </div>

          {/* ESTA ES LA SECCIÓN CLAVE: Renderizado Dinámico de CardMain */}
          <main>
            {publications.length > 0 ? (
              // Mapea sobre el array de publicaciones y renderiza un CardMain por cada una
              publications.map((publication) => (
                <CardMain
                  key={publication.publication_id} // Es crucial para React
                  // <--- AQUÍ ESTÁ EL CAMBIO IMPORTANTE --->
                  imgSrc={publication.image_url || "https://via.placeholder.com/260x321.png?text=Sin+Imagen"} // Usa image_url o un placeholder
                  // <--- FIN DEL CAMBIO --->
                  publicationTitle={publication.content} // 'content' de la DB como título
                  totalLikes={publication.total_likes}
                  totalComments={publication.total_comments}
                  totalShares={publication.total_shares}
                />
              ))
            ) : (
              // Si no hay publicaciones, muestra un mensaje
              <div className="no_publications">
                <p>No hay publicaciones disponibles para mostrar.</p>
                <p>Asegúrate de que tu base de datos 'docedigital' tenga datos en la tabla 'publications'.</p>
              </div>
            )}
          </main>
        </div>
      </div>
      {/* Sección del lado derecho (sin cambios) */}
      <div className="right">
        <MainRightTopCard />
        <MainRightBottomCard />
      </div>
    </div>
  );
}

export default MainContainer;