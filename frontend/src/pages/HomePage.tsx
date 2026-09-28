import { Link } from "react-router-dom";
import classes from "./HomePage.module.css";

export default function HomePage() {
  return <>
    <section className={classes.hero}>
      <div>
        <span className="eyebrow">A LITTLE CURIOSITY. A NEW CONNECTION.</span>
        <h1>Life is better<br />when we <em>gather.</em></h1>
        <p>Find your people, learn something new, and make room for experiences that stay with you.</p>
        <div className={classes.actions}><Link className="button" to="/events">Explore events <span aria-hidden="true">↗</span></Link><Link className="text-link" to="/events/new">Host an experience →</Link></div>
        <div className={classes.note}><span aria-hidden="true">✳</span> Big ideas. Small meetups. Everyone belongs.</div>
      </div>
      <div className={classes.art} aria-hidden="true">
        <div className={classes.orbit}></div>
        <span className={classes.spark}>✳</span>
        <div className={classes.ticket}><span>YOUR NEXT CHAPTER</span><strong>Show up.<br />Connect.<br />Be inspired.</strong><div>ADMIT ONE <span>↗</span></div></div>
        <div className={classes.badge}>GOOD THINGS<br />HAPPEN TOGETHER</div>
      </div>
    </section>
    <section className={classes.discover} aria-labelledby="discover-title">
      <div className={classes.sectionHeading}><div><span className="eyebrow">MAKE TIME FOR SOMETHING GOOD</span><h2 id="discover-title">Your next experience starts here.</h2></div><Link className="text-link" to="/events">View all events ↗</Link></div>
      <div className={classes.cards}>
        {[{ n: "01", icon: "◎", title: "Find your community", text: "Discover gatherings that bring people and shared interests together." }, { n: "02", icon: "✺", title: "Stay curious", text: "Explore fresh perspectives, creative ideas, and something outside your everyday." }, { n: "03", icon: "↗", title: "Make it happen", text: "Have an idea worth sharing? Create an event and bring your community along." }].map(card => <article key={card.n}><div><span>{card.n}</span><b aria-hidden="true">{card.icon}</b></div><h3>{card.title}</h3><p>{card.text}</p></article>)}
      </div>
    </section>
  </>;
}
