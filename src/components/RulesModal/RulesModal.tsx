import React from 'react';
import './RulesModal.css';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  iplMainLogoUrl?: string;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, iplMainLogoUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="rules-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rules-modal-header">
          {iplMainLogoUrl && (
            <img src={iplMainLogoUrl} alt="IPL" className="rules-modal-ipl-logo" />
          )}
          <div className="rules-modal-header-row">
            <h2>🏏 IPL Fantasy League – Official Rules & Instructions</h2>
            <button type="button" className="rules-modal-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>
        <div className="rules-modal-body">
          <section>
            <h3>1. League Overview</h3>
            <ul>
              <li><strong>Total Participants (Team Managers):</strong> e.g. 6 (or 10)</li>
              <li>Each participant owns and manages 1 fantasy franchise</li>
              <li>Teams are built through a live mega auction</li>
              <li>Player performances earn points via the official IPL Fantasy scoring system (iplfantasy.com)</li>
              <li>The team with the highest cumulative points at the end of the IPL season wins</li>
            </ul>
          </section>

          <section>
            <h3>2. Player Pool</h3>
            <ul>
              <li><strong>Total available players:</strong> ~250 (from all IPL squads combined)</li>
              <li>Any player from the official IPL squads is eligible for auction</li>
              <li>No restriction on choosing players from any specific IPL franchise</li>
            </ul>
          </section>

          <section>
            <h3>3. Budget & Squad Size</h3>
            <ul>
              <li>Each team gets <strong>₹120 Crore</strong> virtual budget</li>
              <li><strong>Minimum players:</strong> 16</li>
              <li><strong>Maximum players:</strong> 25</li>
              <li>No restriction on overseas players</li>
            </ul>
          </section>

          <section>
            <h3>4. Player Base Price & Bid Increments</h3>
            <table className="rules-table">
              <thead>
                <tr>
                  <th>Price Range</th>
                  <th>Bid Increment</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>₹10L – ₹1 Cr</td><td>₹5 Lakhs</td></tr>
                <tr><td>₹1 Cr – ₹5 Cr</td><td>₹10 Lakhs</td></tr>
                <tr><td>₹5 Cr – ₹10 Cr</td><td>₹20 Lakhs</td></tr>
                <tr><td>Above ₹10 Cr</td><td>₹25 Lakhs</td></tr>
              </tbody>
            </table>
            <p>Minimum base price of any player: ₹10 Lakhs</p>
          </section>

          <section>
            <h3>5. Auction Process</h3>
            <ul>
              <li>Players are nominated by set (e.g. Marquee, Batsmen) or organizer selection</li>
              <li>Once a player is sold, the amount is deducted from the team’s budget</li>
              <li>No player can be owned by more than one team</li>
              <li>Unsold players may be re-auctioned later</li>
              <li>Auction continues until all teams reach minimum squad size</li>
              <li>If a player is replaced in IPL, the same is followed in this league</li>
            </ul>
          </section>

          <section>
            <h3>6. Team Management & Scoring 📊</h3>
            <p>Points are tracked using the <strong>iplfantasy.com</strong> official scoring system.</p>
          </section>

          <section>
            <h3>7. Budget & Validity Rules</h3>
            <ul>
              <li>Teams must stay within ₹120 Cr budget</li>
              <li>Teams cannot exceed 25 players</li>
              <li>Teams must have at least 16 players</li>
              <li>Teams violating squad rules will not be considered</li>
            </ul>
          </section>

          <section>
            <h3>8. Organizer Authority ⚖️</h3>
            <p>Organizer decisions are final. Any disputes are resolved by the organizer.</p>
          </section>

          <section>
            <h3>9. Fair Play 🤝</h3>
            <ul>
              <li>No collusion between managers</li>
              <li>No reversing completed auction purchases</li>
              <li>Once sold, player ownership is final</li>
              <li>Respectful conduct expected from all</li>
            </ul>
          </section>

          <section>
            <h3>10. Winner 🏆</h3>
            <p>Total points accumulated across the entire IPL season are counted. The highest total wins.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
