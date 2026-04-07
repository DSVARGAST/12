import React, { useMemo } from "react";
import "./MainContainer.css";
import Banner from "../img/1.jpg";
import CardMain from "./CardMain";
import MainRightTopCard from "./MainRightTopCard";
import MainRightBottomCard from "./MainRightBottomCard";
import { getDemoPublications } from "../data/demoData";

function MainContainer() {
  const publications = useMemo(() => getDemoPublications(), []);

  return (
    <div className="maincontainer">
      <div className="left">
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
              <a href="/" className="button" onClick={(event) => event.preventDefault()}>
                Bid Now
              </a>
              <p>
                Ending In <span>2d:15h:20m</span>
              </p>
            </div>
          </div>
        </div>

        <div className="cards">
          <div className="filters">
            <div className="popular">
              <h2>Feed</h2>
              <a href="/" className="button2" onClick={(event) => event.preventDefault()}>
                Popular
              </a>
            </div>
            <div className="filter_buttons">
              <a href="/" className="button" onClick={(event) => event.preventDefault()}>
                All
              </a>
              <a href="/" className="button2" onClick={(event) => event.preventDefault()}>
                Illustration
              </a>
              <a href="/" className="button2" onClick={(event) => event.preventDefault()}>
                Art
              </a>
              <a href="/" className="button2" onClick={(event) => event.preventDefault()}>
                Games
              </a>
            </div>
          </div>

          <main>
            {publications.length > 0 ? (
              publications.map((publication) => (
                <CardMain
                  key={publication.publication_id}
                  imgSrc={publication.image_url}
                  publicationTitle={publication.content}
                  totalLikes={publication.total_likes}
                  totalComments={publication.total_comments}
                  totalShares={publication.total_shares}
                />
              ))
            ) : (
              <div className="no_publications">
                <p>No hay publicaciones demo disponibles para mostrar.</p>
                <p>Puedes sustituir este dataset cuando conectes tu nuevo backend.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      <div className="right">
        <MainRightTopCard />
        <MainRightBottomCard />
      </div>
    </div>
  );
}

export default MainContainer;
