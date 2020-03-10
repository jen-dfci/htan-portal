import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";

const Home = () => (
  <Navbar bg="light" expand="lg">
  <Navbar.Brand href="#home">HTAN Data Portal</Navbar.Brand>
  <Navbar.Toggle aria-controls="basic-navbar-nav" />
  <Navbar.Collapse id="basic-navbar-nav">
    <Nav className="mr-auto">
      <Nav.Link href="/dataRelease">Data Release</Nav.Link>
      <Nav.Link href="/dataStandards">Data Standards</Nav.Link>
      <Nav.Link href="/dataTransfer">Data Transfer</Nav.Link>
    </Nav>
  </Navbar.Collapse>
</Navbar>
)

export default Home

