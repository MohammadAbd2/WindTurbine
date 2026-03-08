import { Link } from "react-router-dom";

export default function TurbineCard({ turbine }) {
    return (
        <div style={{ border: "1px solid gray", padding: "20px" }}>
            <h3>{turbine.name}</h3>
            <p>{turbine.location}</p>
            <Link to={`/turbine/${turbine.id}`}>View Details</Link>
        </div>
    );
}