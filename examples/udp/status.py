"""Publish a sample value and receive MATRIC UDP notifications on Windows."""

import argparse
import getpass
import json
import socket
import time


def main():
    """Authorize, select a connected client, publish status, and listen."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=5300)
    parser.add_argument("--listen-port", type=int, default=50301)
    parser.add_argument("--client-id")
    args = parser.parse_args()
    server = ("127.0.0.1", args.port)
    envelope = {"appName": "Hobby status demo", "appPIN": None}

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as udp:
        # Keep this port stable: MATRIC retains the first notification endpoint.
        udp.bind(("127.0.0.1", args.listen_port))
        udp.settimeout(1)

        def send(command, **fields):
            """Send one command using this same listening socket."""
            message = {**envelope, "command": command, **fields}
            udp.sendto(json.dumps(message).encode("utf-8"), server)

        def receive():
            """Decode an envelope and its nested JSON string, if available."""
            try:
                data, source = udp.recvfrom(65535)
            except socket.timeout:
                return None
            # Replies come from separate sending sockets, not necessarily port 5300.
            if source[0] != server[0]:
                return None
            message = json.loads(data.decode("utf-8"))
            return message["MessageType"], json.loads(message["MessageData"])

        send("CONNECT")
        envelope["appPIN"] = getpass.getpass(
            "Approve in MATRIC, then enter PIN (Enter if PIN checking is off): "
        ) or None
        send("GETCONNECTEDCLIENTS")
        deadline = time.monotonic() + 10
        clients = None
        while time.monotonic() < deadline:
            event = receive()
            if event and event[0] == "ClientList":
                clients = event[1]
                break
        if clients is None:
            raise SystemExit("No client list: check integration settings, port and PIN.")
        print(json.dumps(clients, indent=2, ensure_ascii=False))
        if not clients:
            raise SystemExit("Connect a MATRIC client, load your test deck, then retry.")
        client_id = args.client_id or clients[0]["clientId"]
        if not any(client["clientId"] == client_id for client in clients):
            raise SystemExit("The requested client ID is not in the connected list.")
        print("Target client:", client_id)
        send("SETBUTTONPROPS", clientId=client_id, buttonName="Status",
             data={"text": "Hello from Python"})
        send("SETVARIABLES", Variables=[{
            "Name": "hobby_temperature", "Value": 23.5, "VariableType": "NUMBER",
            "IsPersistent": False, "IsUserEditable": False
        }])
        print("Listening for notifications. Press Ctrl+C to stop.")
        while True:
            event = receive()
            if event:
                print(event[0], json.dumps(event[1], ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
    except (OSError, ValueError, KeyError) as error:
        raise SystemExit("Integration error: " + str(error))
