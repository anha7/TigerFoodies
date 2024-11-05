function PostingAndModal({card}) {
    const [isModalActive, setIsModalActive] = useState(false);

    const handleCardClick = () => {
        setIsModalActive(true);
    };

    return (
        <div>
            <Card onClick={handleCardClick} card = {card} />
            <Modal isModalActive={isModalActive} card = {card}/>
        </div>
    );
}

function Card({ onClick, card }) {
    return (
        <div key={card.card_id} className="card" onClick = {onClick}>
            <div 
                className="card-image"
                style={{ backgroundImage: `url(${card.photo_url})`}}
            >
            </div>
            <div className="card-content">
                <h3>{card.title}</h3>
                <p><b>Location:</b> {card.location}</p>
                <p><b>Dietary Preferences:</b> {card.dietary_tags.join(', ')}</p>
                <p><b>Allergens:</b> {card.allergies.join(', ')}</p>
                <p className="posted-at">Posted {formatTimeAgo(card.posted_at)}</p>
            </div>
        </div>
    );
}

function Modal({isModalActive, card}) {
    return (
        <div className={isModalActive ? 'modal.visible' : 'modal'}>
            <div 
              className="modal-card-image"
              style={{ backgroundImage: `url(${card.photo_url})`}}
            >
            </div>
          <div className="modal-card-content">
              <h3>{card.title}</h3>
              <p className="posted-at">Posted {formatTimeAgo(card.posted_at)}</p>
              <p>Location: {card.location}</p>
              <p>Dietary Restrictions: {card.dietary_tags.join(', ')}</p>
              <p>Allergens: {card.allergies.join(', ')}</p>
              <p>Description: {card.description}</p>
          </div>
        </div>
    );
}
