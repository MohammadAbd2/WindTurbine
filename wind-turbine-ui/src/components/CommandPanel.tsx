import API from "../api/api";

export default function CommandPanel({ turbineId }) {
    const sendCommand = async (type) => {
        await API.post("/commands", {
            turbineId,
            commandType: type,
            payload: "",
        });

        alert("Command sent!");
    };

    return (
        <div>
            <button onClick={() => sendCommand("start")}>Start</button>
            <button onClick={() => sendCommand("stop")}>Stop</button>
        </div>
    );
}