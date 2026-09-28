import { Link } from "react-router-dom";
import Icon from "../components/ui/Icon";
import classes from "./HomePage.module.css";

export default function HomePage() {
  return <>
    <section className={classes.hero}>
      <div>
        <span className="eyebrow">A LITTLE CURIOSITY. A NEW CONNECTION.</span>
        <h1>Life is better<br />when we <em>gather.</em></h1>
        <p>Find your people, learn something new, and make room for experiences that stay with you.</p>
        <div className={classes.actions}><Link className="button" to="/events">Explore events <Icon name="arrow" /></Link><Link className="text-link" to="/events/new">Host an experience <Icon name="plus" /></Link></div>
        <div className={classes.note}><span aria-hidden="true">✳</span> Big ideas. Small meetups. Everyone belongs.</div>
      </div>
      <div className={classes.art} aria-hidden="true">
        <div className={classes.orbit}></div>
        <span className={classes.artLabel}>LESS SCROLLING. MORE SHOWING UP.</span>
        <span className={classes.spark}>✳</span>
        <div className={classes.ticket}><span>YOUR NEXT CHAPTER</span><strong>Show up.<br />Connect.<br /><em>Be inspired.</em></strong><div>ADMIT ONE <span>↗</span></div></div>
        <div className={classes.badge}>GOOD THINGS<br />HAPPEN TOGETHER</div>
      </div>
    </section>
    <section className={classes.discover} aria-labelledby="discover-title">
      <div className={classes.sectionHeading}><div><span className="eyebrow">MAKE TIME FOR SOMETHING GOOD</span><h2 id="discover-title">A little more out of the everyday.</h2></div><Link className="text-link" to="/events">View all events <Icon name="arrow" /></Link></div>
      <div className={classes.cards}>
        {[{ n: "01", icon: "◎", title: "Find your community", text: "Meet people who get excited about the same things you do.", link: "Find your next event", to: "/events" }, { n: "02", icon: "✺", title: "Stay curious", text: "Make space in your calendar for a new idea or a different perspective.", link: "See what's coming up", to: "/events?when=upcoming" }, { n: "03", icon: "↗", title: "Make it happen", text: "A good gathering starts with one person saying, let’s do this.", link: "Host something good", to: "/events/new" }].map(card => <article key={card.n}><div><span>{card.n}</span><b aria-hidden="true">{card.icon}</b></div><h3>{card.title}</h3><p>{card.text}</p><Link className="text-link" to={card.to}>{card.link}<Icon name="arrow" /></Link></article>)}
      </div>
    </section>
  </>;
}
