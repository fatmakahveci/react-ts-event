"use client";

import { Link, useNavigate } from 'react-router-dom';

import Modal from "../UI/Modal/Modal";
import EventForm from '../EventForm/EventForm';

export default function NewEvent() {
  const navigate = useNavigate();

  function handleSubmit(formData: any) {}

  return (
    // <Modal onClose={() => navigate('../')}>
      <EventForm onSubmit={handleSubmit} inputData={undefined}>
        <>
          <Link to="../" className="button-text">
            Cancel
          </Link>
          <button type="submit" className="button">
            Create
          </button>
        </>
      </EventForm>
    // </Modal>
  );
}
